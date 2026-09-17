// Find junk (unnamed / "Testtling." / QA-test / archived) rows in every
// launchops-portal store database. READ-ONLY. Prints page ids for review.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const store = JSON.parse(fs.readFileSync(path.join(__dirname, 'notion-store.json'), 'utf8'));
const env = fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});
const TOKEN = env.NOTION_TOKEN;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(method, url, body) {
  const r = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Notion-Version': '2022-06-28',
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(20000),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(`${r.status} ${j?.message || ''}`);
  return j;
}

function titleOf(props) {
  for (const [k, v] of Object.entries(props || {})) {
    if (v?.type === 'title' && (v.title || []).length) {
      return (v.title || []).map((t) => t.plain_text).join('').trim();
    }
  }
  return '';
}

async function queryAll(dbId) {
  const rows = [];
  let cursor;
  do {
    const body = { page_size: 100 };
    if (cursor) body.start_cursor = cursor;
    const j = await api('POST', `https://api.notion.com/v1/databases/${dbId}/query`, body);
    rows.push(...j.results);
    cursor = j.has_more ? j.next_cursor : null;
  } while (cursor);
  return rows;
}

const JUNK_RE = /(?:qa[\s_-]?test|testtling\.?|^\s*$|^test\b|placeholder|undefined|null|test\s*row|^qa\b|test\s*client)/i;

(async () => {
  let flagged = [];
  for (const [name, dbId] of Object.entries(store.databases || {})) {
    let rows;
    try {
      rows = await queryAll(dbId);
    } catch (e) {
      console.log(`[${name}] query error: ${e.message.slice(0, 80)}`);
      continue;
    }
    for (const r of rows) {
      const t = titleOf(r.properties);
      const junk = r.archived || JUNK_RE.test(t);
      if (junk) {
        flagged.push({ id: r.id, db: name, title: t || '(no title)', created: (r.created_time || '').slice(0, 10) });
      }
    }
    await sleep(600);
  }
  console.log(`JUNK CANDIDATES: ${flagged.length}\n`);
  for (const j of flagged) {
    console.log(`  ${j.db.padEnd(18)} | ${j.created} | "${j.title.slice(0, 28).padEnd(28)}" | ${j.id}`);
  }
  fs.writeFileSync(
    path.join(__dirname, '.junk-candidates.json'),
    JSON.stringify(flagged.map((f) => f.id), null, 0)
  );
  console.log('\nIDs written to launchops-portal/.junk-candidates.json (review, then --archive to act)');
})().catch((e) => console.log('FATAL:', e.message));
