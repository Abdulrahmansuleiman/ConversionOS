#!/usr/bin/env node
// scripts/label-notion-databases.mjs
// Labels every Notion database that is NOT in the portal's keep-set with " (D)"
// so Raymon can spot what to delete in the Notion UI. In-use databases are
// untouched (and any accidental " (D)" on them is removed).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const token = (fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('NOTION_TOKEN=')) || '').slice('NOTION_TOKEN='.length).trim();
if (!token) { console.error('NOTION_TOKEN missing in .env'); process.exit(1); }

const store = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'notion-store.json'), 'utf8'));
const norm = (id) => id.replace(/-/g, '');
const keepDb = new Set(Object.values(store.databases).map(norm));
const keepDs = new Set(Object.values(store.dataSources).map(norm));

const H = {
  'Notion-Version': '2022-06-28',
  Authorization: `Bearer ${token}`,
  'Content-Type': 'application/json',
};

async function api(url, body, method = 'POST') {
  const res = await fetch(url, { method, headers: H, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(30000) });
  return { status: res.status, json: await res.json() };
}

const search = await api('https://api.notion.com/v1/search', { filter: { value: 'data_source', property: 'object' }, page_size: 100 });
if (search.status !== 200) { console.error('search failed', search.status, JSON.stringify(search.json)); process.exit(1); }

const dbs = search.json.results || [];
console.log(`Found ${dbs.length} databases/data-sources:\n`);

const results = [];
for (const db of dbs) {
  const id = db.id.replace(/-/g, '');
  const isKeep = keepDb.has(id) || keepDs.has(id);
  const title = (db.title || []).map((t) => t.plain_text || t.text?.content || '').join('').trim();
  const current = title || '(untitled)';
  const label = isKeep ? 'KEEP' : 'DELETE';

  const stripD = (t) => t.replace(/\s*\(D\)\s*$/, '').trim() || '(untitled)';
  const target = isKeep ? stripD(current) : /\(D\)\s*$/.test(current) ? current : `${current} (D)`;

  if (target !== current) {
    let patched = null;
    if (db.object === 'data_source') {
      patched = await api(`https://api.notion.com/v1/data_sources/${db.id}`, { title: [{ type: 'text', text: { content: target } }] }, 'PATCH');
    } else {
      patched = await api(`https://api.notion.com/v1/databases/${db.id}`, { title: [{ type: 'text', text: { content: target } }] }, 'PATCH');
    }
    results.push({ id: db.id, label, before: current, after: patched.status === 200 ? target : `RENAME FAILED ${patched.status} ${JSON.stringify(patched.json).slice(0, 120)}` });
  } else {
    results.push({ id: db.id, label, before: current, after: 'untouched' });
  }
}

for (const r of results) {
  console.log(`[${r.label}] ${r.before}  ->  ${r.after}\n    id: ${r.id}`);
}

console.log(`\nSummary: ${results.filter((r) => r.label === 'KEEP').length} in use, ${results.filter((r) => r.label === 'DELETE').length} marked (D) for deletion.`);