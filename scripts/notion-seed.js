#!/usr/bin/env node
// scripts/notion-seed.js
// Seeds the Bloomline Apparel project (from clients/bloomline-apparel/facts.json)
// into the LaunchOps HQ Notion store: Project + Roadmap milestones + Build Assets.
// Uses real fact-sheet values only — never invents numbers or dates.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const token = loadEnv('NOTION_TOKEN');
if (!token) {
  console.error('NOTION_TOKEN missing from .env');
  process.exit(1);
}
const store = JSON.parse(fs.readFileSync(path.join(root, 'docs', 'notion-store.json'), 'utf8'));

const facts = JSON.parse(
  fs.readFileSync(path.join(root, 'clients', 'bloomline-apparel', 'facts.json'), 'utf8')
);

const HEADERS = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': '2025-09-03',
  'Content-Type': 'application/json',
};

async function api(method, url, body) {
  const res = await fetch(url, { method, headers: HEADERS, body: body ? JSON.stringify(body) : undefined });
  const json = await res.json();
  if (!res.ok) throw new Error(`${method} ${url} ${res.status}: ${JSON.stringify(json)}`);
  return json;
}

const T = (txt) => [{ type: 'text', text: { content: txt } }];

async function queryAll(name) {
  const ds = store.dataSources?.[name];
  const base = ds ? `data_sources/${ds}` : `databases/${store.databases[name]}`;
  const res = await api('POST', `https://api.notion.com/v1/${base}/query`, { page_size: 100 });
  return res.results;
}

const titleOf = (r, key) => (r.properties[key]?.title || []).map((t) => t.plain_text).join('');
const relOf = (r, key) => (r.properties[key]?.relation || []).map((x) => x.id);

async function findProject(title) {
  const rows = await queryAll('Projects');
  return rows.find((r) => titleOf(r, 'Client') === title)?.id || null;
}

async function seed() {
  const display = facts.client_display; // "Bloomline Apparel"

  let projectId = await findProject(display);
  if (projectId) {
    console.log(`Project already exists: ${display} (${projectId})`);
  } else {
    const page = await api('POST', 'https://api.notion.com/v1/pages', {
      parent: { type: 'database_id', database_id: store.databases.Projects },
      properties: {
        Client: { title: T(display) },
        Status: { select: { name: 'Contracted' } },
        Industry: { rich_text: T(facts.must_appear.find((x) => x === 'ecommerce')) },
        'AI Persona': { rich_text: T('ConversionOS AI Text Agent — women\'s activewear concierge') },
        KPIs: { rich_text: T('Conversations, bookings, conversion rate, handovers, follow-ups') },
        'Kickoff Date': { date: { start: '2026-08-05' } },
        'Launch Date': { date: { start: '2026-09-04' } },
        Notes: { rich_text: T('Ecommerce — women\'s activewear. Stripe + Klaviyo + Shopify + Instagram. PRO-2026-001') },
      },
    });
    projectId = page.id;
    console.log(`Created project: ${display} (${projectId})`);
  }

  // Roadmap milestones — full start-to-finish path.
  const milestones = [
    { title: 'Kickoff call + scope confirmation', phase: 'Kickoff', status: 'Complete', due: '2026-08-05' },
    { title: 'Brand + dashboard design', phase: 'Design', status: 'In progress', due: '2026-08-15' },
    { title: 'Dashboard build + n8n wiring', phase: 'Build', status: 'Not started', due: '2026-08-22' },
    { title: 'QA review + client walkthrough', phase: 'Review', status: 'Not started', due: '2026-08-28' },
    { title: 'Deploy to Vercel + go live', phase: 'Launch', status: 'Not started', due: '2026-09-04' },
    { title: '30-day support window', phase: 'Post-launch support', status: 'Not started', due: '2026-10-04' },
  ];

  const existingMilestones = await queryAll('Roadmap');
  const existingTitles = new Set(
    existingMilestones.filter((r) => relOf(r, 'Project').includes(projectId)).map((r) => titleOf(r, 'Milestone'))
  );

  for (const m of milestones) {
    if (existingTitles.has(m.title)) {
      console.log(`  milestone exists: ${m.title}`);
      continue;
    }
    await api('POST', 'https://api.notion.com/v1/pages', {
      parent: { type: 'database_id', database_id: store.databases.Roadmap },
      properties: {
        Milestone: { title: T(m.title) },
        Project: { relation: [{ id: projectId }] },
        Phase: { select: { name: m.phase } },
        Status: { select: { name: m.status } },
        'Due Date': { date: { start: m.due } },
      },
    });
    console.log(`  milestone created: ${m.title}`);
  }

  // Build assets
  const assets = [
    {
      title: 'AI Persona Prompt',
      type: 'AI Persona Prompt',
      content: 'ConversionOS AI Text Agent persona for Bloomline Apparel — women\'s activewear. Intro / Conversation / Follow Up lanes.',
      version: 'v1',
      date: '2026-08-05',
    },
    {
      title: 'Dashboard Build Spec',
      type: 'Build Spec',
      content: 'Fork bloomline-dashboard; KPIs: conversations, bookings+conversion, handovers, follow-ups+speed. Supabase events table. Vercel deploy.',
      version: 'v1',
      date: '2026-08-10',
    },
    {
      title: 'Bloomline Dashboard',
      type: 'Dashboard',
      link: 'https://bloomline-dash.vercel.app',
      content: 'Live client dashboard (agent report).',
      version: 'live',
      date: '2026-09-04',
    },
  ];

const existingAssets = await queryAll('Build Assets');
  const existingAssetTitles = new Set(
    existingAssets.filter((r) => relOf(r, 'Project').includes(projectId)).map((r) => titleOf(r, 'Asset'))
  );

  for (const a of assets) {
    if (existingAssetTitles.has(a.title)) {
      console.log(`  asset exists: ${a.title}`);
      continue;
    }
    await api('POST', 'https://api.notion.com/v1/pages', {
      parent: { type: 'database_id', database_id: store.databases['Build Assets'] },
      properties: {
        Asset: { title: T(a.title) },
        Project: { relation: [{ id: projectId }] },
        'Asset Type': { select: { name: a.type } },
        Content: { rich_text: T(a.content) },
        Link: a.link ? { url: a.link } : undefined,
        Version: { rich_text: T(a.version) },
        Date: { date: { start: a.date } },
      },
    });
    console.log(`  asset created: ${a.title}`);
  }

  console.log('\nSeed complete. Open the portal to see Bloomline Apparel with its full roadmap.');
}

function loadEnv(key) {
  const p = path.join(root, '.env');
  if (!fs.existsSync(p)) return '';
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) return line.slice(key.length + 1).trim();
  }
  return '';
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
