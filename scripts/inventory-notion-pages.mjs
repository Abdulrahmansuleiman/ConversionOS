#!/usr/bin/env node
// scripts/inventory-notion-pages.mjs — lists pages under LaunchOps HQ for reference (no renames).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const token = (fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).find((l) => l.startsWith('NOTION_TOKEN=')) || '').slice('NOTION_TOKEN='.length).trim();

const H = { 'Notion-Version': '2022-06-28', Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
async function post(url, body) {
  const res = await fetch(url, { method: 'POST', headers: H, body: JSON.stringify(body), signal: AbortSignal.timeout(30000) });
  return res.json();
}

const pages = [];
let cursor;
do {
  const r = await post('https://api.notion.com/v1/search', { filter: { value: 'page', property: 'object' }, page_size: 100, start_cursor: cursor });
  pages.push(...(r.results || []));
  cursor = r.has_more ? r.next_cursor : undefined;
} while (cursor);

for (const p of pages) {
  const title = (p.properties?.title?.title || p.properties?.Name?.title || []).map((t) => t.plain_text).join('');
  const parentType = p.parent?.type || '?';
  console.log(`[page] ${title || '(untitled)'}  (parent:${parentType}${p.parent?.database_id ? ` ${p.parent.database_id}` : ''})  id:${p.id}`);
}
console.log(`\nTotal pages: ${pages.length}`);