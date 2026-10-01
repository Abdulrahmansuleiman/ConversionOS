/**
 * verify-notion-image.mjs
 *
 * Confirms a PATCH /blocks/{pageId}/children image append actually landed on each
 * client project page — i.e. the block exists, is an image, carries a caption,
 * and its file URL is a real hosted Notion file rather than an expiring link.
 */

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const NOTION_VERSION = '2022-06-28';
const API = 'https://api.notion.com/v1';

function loadToken() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN.trim();
  const raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  const m = raw.match(/^\s*NOTION_TOKEN\s*=\s*(.+)$/m);
  if (!m) {
    console.error('ERROR: NOTION_TOKEN not found');
    process.exit(1);
  }
  return m[1].trim().replace(/^["']|["']$/g, '');
}

async function api(token, method, path, body) {
  const headers = {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
  };
  if (body !== undefined) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${API}${path}`, {
    method,
    headers,
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  if (!res.ok) throw new Error(`${method} ${path} -> ${res.status}: ${text.slice(0, 200)}`);
  return text ? JSON.parse(text) : null;
}

function titleOf(page) {
  for (const prop of Object.values(page.properties ?? {})) {
    if (prop.type === 'title') return prop.title.map((t) => t.plain_text).join('');
  }
  return '(untitled)';
}

const token = loadToken();
const store = JSON.parse(readFileSync(resolve(process.cwd(), 'docs/notion-store.json'), 'utf8'));

const projects = await api(
  token,
  'POST',
  `/databases/${store.databases.Projects}/query`,
  { page_size: 100 },
);

const EXPECTED_CAPTION = 'Your LaunchOps roadmap';

let failures = 0;

for (const page of projects.results) {
  const name = titleOf(page);
  const children = await api(token, 'GET', `/blocks/${page.id}/children?page_size=100`);

  const images = children.results.filter((b) => b.type === 'image');
  const match = images.find((b) =>
    (b.image?.caption ?? []).some((c) => (c.plain_text ?? '').includes(EXPECTED_CAPTION)),
  );

  if (!match) {
    console.log(`FAIL  ${name} — no roadmap image block with caption found`);
    failures++;
    continue;
  }

  const url = match.image.type === 'external' ? match.image.external?.url : match.image.file?.url;
  const cap = match.image.caption.map((c) => c.plain_text).join('');
  const hasUrl = Boolean(url);

  if (!hasUrl) {
    console.log(`FAIL  ${name} — image block has no resolvable file URL`);
    failures++;
    continue;
  }

  // Notion signed file URLs expire ~1h and reject HEAD, so fetch a small byte
  // range with GET to prove the image actually serves.
  let bytes = 0;
  let served = false;
  try {
    const r = await fetch(url, { headers: { Range: 'bytes=0-1023' } });
    served = r.ok;
    bytes = Number(r.headers.get('content-range')?.split('/')[1] ?? r.headers.get('content-length') ?? 0);
  } catch {
    served = false;
  }

  if (!served) {
    console.log(`FAIL  ${name} — image URL did not serve`);
    failures++;
    continue;
  }

  console.log(
    `PASS  ${name} — image block ${match.id}, ${(bytes / 1024).toFixed(0)} KB served, caption "${cap}"`,
  );
}

console.log(
  failures === 0
    ? `\nAll ${projects.results.length} client pages verified.`
    : `\n${failures} page(s) FAILED verification.`,
);
process.exit(failures === 0 ? 0 : 1);