// Debug: print raw property keys + a sample of each row's title-ish value in the
// launchops-portal store, so we match the real schema before we archive anything.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});
const TOKEN = env.NOTION_TOKEN;
const auth = { Authorization: `Bearer ${TOKEN}` };

const store = JSON.parse(fs.readFileSync(path.join(__dirname, 'notion-store.json'), 'utf8'));

async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: { ...auth, 'Notion-Version': '2022-06-28', 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(15000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${j?.message || ''}`);
  return j;
}

async function queryAll(dbId) {
  const rows = [];
  let cursor;
  do {
    const b = { page_size: 100 };
    if (cursor) b.start_cursor = cursor;
    const j = await api('POST', `https://api.notion.com/v1/databases/${dbId}/query`, b);
    rows.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows;
}

function peekTitle(properties) {
  // Find the first title-type property KEY and return its text.
  for (const [k, v] of Object.entries(properties || {})) {
    if (v?.type === 'title') {
      const txt = (v.title || []).map((x) => x.plain_text).join('').trim();
      return { titleKey: k, text: txt || '(EMPTY TITLE)' };
    }
  }
  return { titleKey: null, text: '(NO TITLE-TYPE PROP)' };
}

(async () => {
  const dbs = store.databases || {};
  for (const [name, id] of Object.entries(dbs)) {
    if (name === 'Client Documents') continue;
    let rows;
    try { rows = await queryAll(id); } catch (e) { console.log(`[${name}] ERR ${e.message.slice(0, 80)}`); continue; }
    console.log(`\n== ${name} (${id.slice(0, 8)}) — ${rows.length} rows`);
    for (const r of rows) {
      const { titleKey, text } = peekTitle(r.properties);
      const created = (r.created_time || '').slice(0, 16).replace('T', ' ');
      const arch = r.archived ? ' ARCHIVED' : '';
      console.log(`  ${String(text).slice(0, 34).padEnd(36)} | key=${titleKey} | created=${created} | ${r.id}${arch}`);
    }
  }
})().catch((e) => console.log('FATAL:', e.message));