#!/usr/bin/env node
// scripts/notion-upload-document.mjs
// Uploads a generated client document (PDF) into the Notion "Client Documents"
// database and attaches the file to the created page via Notion's native
// file_upload flow (POST /v1/file_uploads -> send bytes -> attach by id).
//
// Usage:
//   node scripts/notion-upload-document.mjs \
//     --file ./out/invoice.pdf \
//     --client-id 3c263684-59d9-810c-acef-d682a9189788 \
//     --title "Invoice PRO-2026-001 - Bloomline Apparel" \
//     --type Invoice \
//     --amount 750 \
//     --date 2026-08-20 \
//     --status Sent \
//     --method Stripe \
//     --notes "..."
//
// --client-name can be used instead of --client-id (resolved against the
// Projects database). Prints the created page URL + id on success.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const token = (fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('NOTION_TOKEN=')) || '').slice('NOTION_TOKEN='.length).trim();
if (!token) { console.error('NOTION_TOKEN missing in .env'); process.exit(1); }

const store = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'notion-store.json'), 'utf8'));
const DOC_DB = store.databases['Client Documents'];
const PROJECTS_DB = store.databases.Projects;

const H = { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json', 'Notion-Version': '2022-06-28' };

function arg(name) {
  const i = process.argv.indexOf(name);
  return i > -1 ? process.argv[i + 1] : undefined;
}

async function api(url, { method = 'GET', body, headers = {} } = {}) {
  const res = await fetch(url, {
    method,
    headers: { ...H, ...headers },
    body: body !== undefined ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    signal: AbortSignal.timeout(60000),
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${url} -> ${res.status} ${JSON.stringify(json).slice(0, 300)}`);
  return json;
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function resolveClientId() {
  const id = arg('--client-id');
  if (id) return id.replace(/-/g, '');
  const name = arg('--client-name');
  if (!name) throw new Error('--client-id or --client-name is required');
  const q = await api(`https://api.notion.com/v1/databases/${PROJECTS_DB}/query`, {
    method: 'POST',
    body: { filter: { property: 'Client', title: { equals: name } } },
  });
  const hit = q.results[0];
  if (!hit) throw new Error(`No project found named "${name}" in the Projects database`);
  return hit.id.replace(/-/g, '');
}

async function uploadPdf(filePath) {
  const bytes = fs.readFileSync(filePath);
  if (bytes.length > 20 * 1024 * 1024) throw new Error('File exceeds 20MB (single-part upload limit)');
  const fileName = path.basename(filePath);

  const created = await api('https://api.notion.com/v1/file_uploads', {
    method: 'POST',
    body: { mode: 'single_part' },
  });
  console.log(`file_upload created: ${created.id} (status ${created.status})`);

  const fd = new FormData();
  fd.append('file', new Blob([bytes], { type: 'application/pdf' }), fileName);
  const sent = await fetch(created.upload_url, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Notion-Version': '2026-03-11' },
    body: fd,
    signal: AbortSignal.timeout(60000),
  });
  const sentJson = await sent.json();
  if (!sent.ok) throw new Error(`byte upload failed ${sent.status}: ${JSON.stringify(sentJson).slice(0, 300)}`);
  console.log(`file bytes sent, status ${sentJson.status}`);

  let status = 'pending';
  for (let i = 0; i < 10; i++) {
    const check = await api(`https://api.notion.com/v1/file_uploads/${created.id}`);
    status = check.status;
    if (status === 'uploaded' || status === 'failed' || status === 'expired') break;
    await sleep(500);
  }
  if (status !== 'uploaded') throw new Error(`upload did not reach "uploaded" (status ${status})`);
  console.log(`upload confirmed, status ${status}`);

  return { id: created.id, name: fileName };
}

async function main() {
  const filePath = arg('--file');
  if (!filePath) { console.error('--file is required'); process.exit(1); }
  if (!fs.existsSync(filePath)) { console.error(`file not found: ${filePath}`); process.exit(1); }

  const clientId = await resolveClientId();
  const upload = await uploadPdf(filePath);

  const title = arg('--title') || path.basename(filePath, path.extname(filePath));
  const props = {
    Name: { title: [{ type: 'text', text: { content: title } }] },
    Client: { relation: [{ id: clientId }] },
    'Document Type': arg('--type') ? { select: { name: arg('--type') } } : undefined,
    'Document Date': arg('--date') ? { date: { start: arg('--date') } } : undefined,
    Amount: arg('--amount') ? { number: Number(arg('--amount')) } : undefined,
    Status: arg('--status') ? { select: { name: arg('--status') } } : undefined,
    'Paid Date': arg('--paid-date') ? { date: { start: arg('--paid-date') } } : undefined,
    'Payment Method': arg('--method') ? { select: { name: arg('--method') } } : undefined,
    File: { files: [{ type: 'file_upload', file_upload: { id: upload.id }, name: upload.name }] },
    Notes: arg('--notes') ? { rich_text: [{ type: 'text', text: { content: arg('--notes') } }] } : undefined,
  };
  for (const k of Object.keys(props)) if (props[k] === undefined) delete props[k];

  const page = await api('https://api.notion.com/v1/pages', {
    method: 'POST',
    body: {
      parent: { type: 'database_id', database_id: DOC_DB },
      properties: props,
      children: [{ type: 'pdf', pdf: { type: 'file_upload', file_upload: { id: upload.id } } }],
    },
  });

  const clean = page.id.replace(/-/g, '');
  const url = `https://notion.so/${clean.slice(0, 8)}${clean.slice(8, 12)}${clean.slice(12, 16)}${clean.slice(16)}`;
  console.log(`\nCreated document page: ${title}`);
  console.log(`id:  ${page.id}`);
  console.log(`url: ${url}`);
}

main().catch((e) => { console.error(e); process.exit(1); });