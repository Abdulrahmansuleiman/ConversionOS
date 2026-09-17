// launchops-portal: find junk rows (unnamed / placeholder "Testtling." cards) in every
// portal Notion database, then (--archive) archive them so the Flight Deck looks clean.
// DRY RUN unless --archive. Reads launchops-portal/notion-store.json via ../../.env token.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..', '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});
const TOKEN = env.NOTION_TOKEN;
const SHOULD_ARCHIVE = process.argv.includes('--archive');
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

// Junk if: empty title, or QA/test-ish name, or archived flag already set.
const JUNK_RE = /qa\s*-?\s*test|testtling\.?|test\s*row|test\s*client|placeholder|^\s*$|undefined|null|\(no\s*title\)|^test[\.\s]*$/i;

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
