#!/usr/bin/env node
// scripts/notion-init.js
// Creates the LaunchOps project-store databases in Notion via the API.
// Idempotent: if a database with the same title already exists under LaunchOps HQ,
// it is reused (so re-running never duplicates).
//
// Reads NOTION_TOKEN from .env. Writes docs/notion-store.json with the page + db ids.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const OUT = path.join(root, 'docs', 'notion-store.json');

const token = loadEnv('NOTION_TOKEN');
if (!token) {
  console.error('NOTION_TOKEN is missing from .env — aborting.');
  process.exit(1);
}

// Note: databases are created with the classic API version (2022-06-28) so the
// schema sticks. The 2025-09-03 version creates data-source-backed databases
// that ignore the properties payload (a Notion API behavior change).
const HEADERS = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': '2022-06-28',
  'Content-Type': 'application/json',
};

const HQ_TITLE = 'LaunchOps HQ';

async function api(method, url, body) {
  const res = await fetch(url, {
    method,
    headers: HEADERS,
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json();
  if (!res.ok) {
    console.error(`[${method} ${url}] ${res.status}`, JSON.stringify(json));
    process.exit(1);
  }
  return json;
}

function loadEnv(key) {
  const p = path.join(root, '.env');
  if (!fs.existsSync(p)) return '';
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) return line.slice(key.length + 1).trim();
  }
  return '';
}

const T = (txt) => [{ type: 'text', text: { content: txt } }];
const sel = (opts) => ({ type: 'select', select: { options: opts.map((o) => ({ name: o })) } });
const rich = () => ({ type: 'rich_text', rich_text: {} });
const num = (fmt) => ({ type: 'number', number: { format: fmt || 'number' } });
const url = () => ({ type: 'url', url: {} });
const date = () => ({ type: 'date', date: {} });
const chk = () => ({ type: 'checkbox', checkbox: {} });
const files = () => ({ type: 'files', files: {} });
const rel = (dbId) => ({
  type: 'relation',
  relation: { database_id: dbId, type: 'single_property', single_property: {} },
});

const STATUS = ['In Discovery', 'Proposed', 'Contracted', 'Building', 'QA', 'Live', 'Completed'];
const PHASES = ['Kickoff', 'Design', 'Build', 'Review', 'Launch', 'Post-launch support'];
const PHASE_STATUS = ['Not started', 'In progress', 'Blocked', 'Complete'];
const ASSET_TYPES = ['AI Persona Prompt', 'Build Spec', 'n8n Workflow', 'Dashboard', 'Contract', 'Invoice', 'Proposal', 'Receipt'];
const FEEDBACK_STATUS = ['New', 'Reviewed', 'Archived'];
const DOC_TYPES = ['Proposal', 'Contract', 'Invoice', 'Receipt', 'Payment Proof'];
const DOC_STATUS = ['Draft', 'Sent', 'Paid', 'Outstanding', 'Overdue'];
const PAYMENT_METHODS = ['Stripe', 'Bank', 'PayPal', 'Other'];

async function findHQ() {
  const list = await api('POST', 'https://api.notion.com/v1/search', {
    page_size: 50,
    query: HQ_TITLE,
    filter: { value: 'page', property: 'object' },
  });
  const hq = list.results.find((r) => {
    const t = r.properties?.title?.title?.[0]?.plain_text;
    return r.object === 'page' && t === HQ_TITLE;
  });
  return hq ? hq.id : null;
}

async function findDatabase(title) {
  const list = await api('POST', 'https://api.notion.com/v1/search', {
    page_size: 100,
    query: title,
    filter: { value: 'database', property: 'object' },
  });
  return list.results.find((r) => {
    const t = (r.title || []).map((x) => x.plain_text).join('');
    return r.object === 'database' && t === title;
  })?.id || null;
}

async function createDatabase(pageId, title, properties) {
  // Deliberately no search-and-reuse here: search is eventually consistent and
  // would reuse old/broken databases. Idempotency comes from the store file.
  const db = await api('POST', 'https://api.notion.com/v1/databases', {
    parent: { type: 'page_id', page_id: pageId },
    title: T(title),
    properties,
  });
  console.log(`create ${title}: ${db.id}`);
  return db.id;
}

function loadStore() {
  try {
    return JSON.parse(fs.readFileSync(OUT, 'utf8'));
  } catch {
    return null;
  }
}

async function verifyDb(id, name) {
  const db = await api('GET', `https://api.notion.com/v1/databases/${id}`);
  console.log(`reuse  ${name}: ${db.id}`);
  return db.id;
}

async function main() {
  const hqId = await findHQ();
  if (!hqId) {
    console.error(`Could not find the "${HQ_TITLE}" page — create it in Notion and connect this integration to it (page → ⋯ → Connections).`);
    process.exit(1);
  }
  console.log(`HQ page: ${hqId}`);

  // Reuse the mapping file if it exists — the source of truth. Search is
  // eventually consistent and would otherwise create duplicate databases.
  const known = loadStore();
  const DB_NAMES = ['Projects', 'Roadmap', 'Build Assets', 'Client Feedback', 'Testimonials', 'Client Documents'];

  const createProjects = async () => createDatabase(hqId, 'Projects', {
    Client: { type: 'title', title: {} },
    Status: sel(STATUS),
    Industry: rich(),
    'AI Persona': rich(),
    KPIs: rich(),
    'Dashboard URL': url(),
    'Repo URL': url(),
    'Kickoff Date': date(),
    'Launch Date': date(),
    Notes: rich(),
  });

  const projectsDb = known?.databases?.Projects
    ? (await verifyDb(known.databases.Projects, 'Projects'))
    : await createProjects();

  const roadmapDb = known?.databases?.Roadmap
    ? (await verifyDb(known.databases.Roadmap, 'Roadmap'))
    : await createDatabase(hqId, 'Roadmap', {
        Milestone: { type: 'title', title: {} },
        Project: rel(projectsDb),
        Phase: sel(PHASES),
        Status: sel(PHASE_STATUS),
        'Due Date': date(),
        Notes: rich(),
      });

  const buildAssetsDb = known?.databases?.['Build Assets']
    ? (await verifyDb(known.databases['Build Assets'], 'Build Assets'))
    : await createDatabase(hqId, 'Build Assets', {
        Asset: { type: 'title', title: {} },
        Project: rel(projectsDb),
        'Asset Type': sel(ASSET_TYPES),
        Content: rich(),
        Link: url(),
        Version: rich(),
        Date: date(),
      });

  const feedbackDb = known?.databases?.['Client Feedback']
    ? (await verifyDb(known.databases['Client Feedback'], 'Client Feedback'))
    : await createDatabase(hqId, 'Client Feedback', {
        Feedback: { type: 'title', title: {} },
        Project: rel(projectsDb),
        Rating: num('number'),
        'What Went Well': rich(),
        'What Could Improve': rich(),
        'Would Recommend': chk(),
        Submitted: date(),
        Status: sel(FEEDBACK_STATUS),
      });

  const testimonialsDb = known?.databases?.Testimonials
    ? (await verifyDb(known.databases.Testimonials, 'Testimonials'))
    : await createDatabase(hqId, 'Testimonials', {
        Quote: { type: 'title', title: {} },
        Project: rel(projectsDb),
        Client: rich(),
        Rating: num('number'),
        Source: rich(),
        Approved: chk(),
        Date: date(),
      });

  const documentsDb = known?.databases?.['Client Documents']
    ? (await verifyDb(known.databases['Client Documents'], 'Client Documents'))
    : await createDatabase(hqId, 'Client Documents', {
        Name: { type: 'title', title: {} },
        Client: rel(projectsDb),
        'Document Type': sel(DOC_TYPES),
        'Document Date': date(),
        Amount: num('number'),
        Status: sel(DOC_STATUS),
        'Paid Date': date(),
        'Payment Method': sel(PAYMENT_METHODS),
        File: files(),
        Notes: rich(),
      });

  const store = {
    pageId: hqId,
    databases: {
      Projects: projectsDb,
      Roadmap: roadmapDb,
      'Build Assets': buildAssetsDb,
      'Client Feedback': feedbackDb,
      Testimonials: testimonialsDb,
      'Client Documents': documentsDb,
    },
  };

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, JSON.stringify(store, null, 2) + '\n');
  console.log(`\nWrote ${OUT}`);
  console.log(JSON.stringify(store, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});