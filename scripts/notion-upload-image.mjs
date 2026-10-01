/**
 * notion-upload-image.mjs
 *
 * Uploads an image file to Notion and appends it as an `image` block to one or
 * more client project pages.
 *
 * Replaces the deleted scripts/notion-upload-document.mjs (removed in 0efbc81),
 * which hardcoded Content-Type: application/pdf and always wrote into the
 * Client Documents database. Neither behaviour works for attaching a PNG to a
 * client project page, so this is a purpose-built path for image blocks.
 *
 * Usage:
 *   node scripts/notion-upload-image.mjs --list
 *   node scripts/notion-upload-image.mjs --file ./assets/roadmap/out/x.png \
 *        --client "Bloomline Apparel" --caption "Your LaunchOps roadmap"
 *   node scripts/notion-upload-image.mjs --file ./x.png --all \
 *        --caption "Your LaunchOps roadmap"
 *
 * Env:
 *   NOTION_TOKEN  — server-side integration token, read from .env
 *
 * Mechanics (Notion file-upload API):
 *   1. POST /v1/file_uploads            { mode: 'single_part' }  -> fileUploadId
 *   2. POST /v1/file_uploads/{id}/send  multipart FormData 'file' -> uploads bytes
 *      (POST, not PUT — PUT returns 400 invalid_request_url)
 *   3. PATCH /v1/pages/{pageId}        children: [ { image: { file_upload: { id } } } ]
 *
 * Constraints: 20 MB single-part limit. Reads ids from docs/notion-store.json.
 */

import { readFileSync } from 'node:fs';
import { basename, resolve } from 'node:path';

const NOTION_VERSION = '2022-06-28';
const API = 'https://api.notion.com/v1';
const MAX_BYTES = 20 * 1024 * 1024;

function fail(msg) {
  console.error(`ERROR: ${msg}`);
  process.exit(1);
}

function parseArgs(argv) {
  const out = { file: null, client: null, all: false, list: false, caption: null, position: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--file') out.file = argv[++i];
    else if (a === '--client') out.client = argv[++i];
    else if (a === '--caption') out.caption = argv[++i];
    else if (a === '--position') out.position = argv[++i];
    else if (a === '--all') out.all = true;
    else if (a === '--list') out.list = true;
    else fail(`unknown argument: ${a}`);
  }
  return out;
}

/** Load NOTION_TOKEN from process.env or the repo .env. Never echoes the value. */
function loadToken() {
  if (process.env.NOTION_TOKEN) return process.env.NOTION_TOKEN.trim();
  let raw;
  try {
    raw = readFileSync(resolve(process.cwd(), '.env'), 'utf8');
  } catch {
    fail('NOTION_TOKEN not in process.env and .env not readable from cwd');
  }
  const m = raw.match(/^\s*NOTION_TOKEN\s*=\s*(.+)$/m);
  if (!m) fail('NOTION_TOKEN not found in .env');
  return m[1].trim().replace(/^["']|["']$/g, '');
}

function readStore() {
  try {
    return JSON.parse(readFileSync(resolve(process.cwd(), 'docs/notion-store.json'), 'utf8'));
  } catch {
    fail('docs/notion-store.json not readable from cwd');
  }
}

async function api(token, method, path, { body, form, headers = {} } = {}) {
  const h = {
    Authorization: `Bearer ${token}`,
    'Notion-Version': NOTION_VERSION,
    ...headers,
  };
  let payload;
  if (form) {
    payload = form;
  } else if (body !== undefined) {
    h['Content-Type'] = 'application/json';
    payload = JSON.stringify(body);
  }

  const res = await fetch(`${API}${path}`, { method, headers: h, body: payload });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    /* non-JSON error body */
  }

  if (!res.ok) {
    const detail = json?.message || text?.slice(0, 300) || res.status;
    throw new Error(`${method} ${path} -> ${res.status}: ${detail}`);
  }
  return json;
}

function titleOf(page) {
  for (const prop of Object.values(page.properties ?? {})) {
    if (prop.type === 'title') return prop.title.map((t) => t.plain_text).join('');
  }
  return '(untitled)';
}

/** Query the Projects database; databases query under 2022-06-28 is /v1/databases/{id}/query. */
async function listProjects(token, dbId) {
  const r = await api(token, 'POST', `/databases/${dbId}/query`, {
    body: { page_size: 100 },
  });
  return r.results.map((p) => ({ id: p.id, title: titleOf(p) }));
}

/** Upload bytes and return the ready file_upload id. */
async function uploadFile(token, path) {
  const bytes = readFileSync(path);
  if (bytes.length > MAX_BYTES) {
    fail(`file is ${(bytes.length / 1024 / 1024).toFixed(2)} MB, over Notion's 20 MB single-part limit`);
  }

  const created = await api(token, 'POST', '/file_uploads', {
    body: { mode: 'single_part', filename: basename(path), content_type: 'image/png' },
  });
  const id = created.id;

  const form = new FormData();
  form.append('file', new Blob([bytes], { type: 'image/png' }), basename(path));

  await api(token, 'POST', `/file_uploads/${id}/send`, { form });

  // Poll until the upload is marked uploaded.
  const deadline = Date.now() + 30_000;
  for (;;) {
    const st = await api(token, 'GET', `/file_uploads/${id}`);
    if (st.status === 'uploaded') return id;
    if (st.status === 'failed' || st.status === 'expired') {
      fail(`file upload ended in status "${st.status}": ${st.error?.message ?? 'no detail'}`);
    }
    if (Date.now() > deadline) fail('file upload did not reach "uploaded" within 30s');
    await new Promise((r) => setTimeout(r, 1000));
  }
}

/**
 * Append the image block to a page.
 *
 * Under Notion-Version 2022-06-28, `children` is NOT accepted on PATCH /pages/{id}
 * (400 "body.children should be not present"). Blocks are appended through
 * PATCH /blocks/{block_id}/children instead.
 */
async function attachImage(token, pageId, fileUploadId, caption, position) {
  const image = { type: 'image', image: { file_upload: { id: fileUploadId } } };
  if (caption) {
    image.image.caption = [{ type: 'text', text: { content: caption } }];
  }
  const body = { children: [image] };
  if (position) body.after = position;

  return api(token, 'PATCH', `/blocks/${pageId}/children`, { body });
}

const args = parseArgs(process.argv.slice(2));
const token = loadToken();
const store = readStore();
const projectsDb = store.databases?.Projects;
if (!projectsDb) fail('docs/notion-store.json has no "Projects" database id');

if (args.list || (!args.file && !args.all && !args.client)) {
  const projects = await listProjects(token, projectsDb);
  console.log(`Projects database: ${projectsDb}`);
  console.log(`Clients (${projects.length}):`);
  for (const p of projects) console.log(`  ${p.title}\t${p.id}`);
  process.exit(0);
}

if (!args.file) fail('--file <path> is required');
if (!args.all && !args.client) fail('one of --client "<name>" or --all is required');

const projects = await listProjects(token, projectsDb);
let targets;
if (args.all) {
  targets = projects;
} else {
  const needle = args.client.trim().toLowerCase();
  const hits = projects.filter(
    (p) => p.title.toLowerCase() === needle || p.title.toLowerCase().includes(needle),
  );
  if (hits.length === 0) {
    console.error(`No client matched "${args.client}". Known clients:`);
    for (const p of projects) console.error(`  ${p.title}`);
    process.exit(1);
  }
  if (hits.length > 1) {
    console.error(`"${args.client}" matched ${hits.length} clients, be more specific:`);
    for (const p of hits) console.error(`  ${p.title}`);
    process.exit(1);
  }
  targets = hits;
}

const filePath = resolve(process.cwd(), args.file);
console.log(`Uploading ${basename(filePath)} ...`);
const uploadId = await uploadFile(token, filePath);
console.log(`  uploaded, file_upload id ${uploadId}`);

for (const t of targets) {
  await attachImage(token, t.id, uploadId, args.caption);
  console.log(`  attached to "${t.title}" (${t.id})`);
}

console.log(`\nDone. ${targets.length} client page(s) updated.`);