#!/usr/bin/env node
// scripts/notion-fix-schema.js
// The 2025-09-03 database-creation API created data-source-backed databases that
// only got a default "Name" title property. This patches each data source with
// the real schema (renaming the default title to the intended one first).
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

const H = {
  Authorization: `Bearer ${token}`,
  'Notion-Version': '2025-09-03',
  'Content-Type': 'application/json',
};

const SCHEMAS = {
  Projects: {
    title: 'Client',
    props: {
      Status: { select: { options: ['In Discovery', 'Proposed', 'Contracted', 'Building', 'QA', 'Live', 'Completed'].map((n) => ({ name: n })) } },
      Industry: { rich_text: {} },
      'AI Persona': { rich_text: {} },
      KPIs: { rich_text: {} },
      'Dashboard URL': { url: {} },
      'Repo URL': { url: {} },
      'Kickoff Date': { date: {} },
      'Launch Date': { date: {} },
      Notes: { rich_text: {} },
    },
  },
  Roadmap: {
    title: 'Milestone',
    props: {
      Project: { relation: { database_id: store.databases.Projects, type: 'single_property', single_property: {} } },
      Phase: { select: { options: ['Kickoff', 'Design', 'Build', 'Review', 'Launch', 'Post-launch support'].map((n) => ({ name: n })) } },
      Status: { select: { options: ['Not started', 'In progress', 'Blocked', 'Complete'].map((n) => ({ name: n })) } },
      'Due Date': { date: {} },
      Notes: { rich_text: {} },
    },
  },
  'Build Assets': {
    title: 'Asset',
    props: {
      Project: { relation: { database_id: store.databases.Projects, type: 'single_property', single_property: {} } },
      'Asset Type': { select: { options: ['AI Persona Prompt', 'Build Spec', 'n8n Workflow', 'Dashboard', 'Contract', 'Invoice', 'Proposal', 'Receipt'].map((n) => ({ name: n })) } },
      Content: { rich_text: {} },
      Link: { url: {} },
      Version: { rich_text: {} },
      Date: { date: {} },
    },
  },
  'Client Feedback': {
    title: 'Feedback',
    props: {
      Project: { relation: { database_id: store.databases.Projects, type: 'single_property', single_property: {} } },
      Rating: { number: { format: 'number' } },
      'What Went Well': { rich_text: {} },
      'What Could Improve': { rich_text: {} },
      'Would Recommend': { checkbox: {} },
      Submitted: { date: {} },
      Status: { select: { options: ['New', 'Reviewed', 'Archived'].map((n) => ({ name: n })) } },
    },
  },
  Testimonials: {
    title: 'Quote',
    props: {
      Project: { relation: { database_id: store.databases.Projects, type: 'single_property', single_property: {} } },
      Client: { rich_text: {} },
      Rating: { number: { format: 'number' } },
      Source: { rich_text: {} },
      Approved: { checkbox: {} },
      Date: { date: {} },
    },
  },
};

async function getJson(url, opts = {}) {
  const r = await fetch(url, { ...opts, headers: { ...H, ...(opts.headers || {}) } });
  const j = await r.json();
  return { status: r.status, json: j };
}

for (const [name, schema] of Object.entries(SCHEMAS)) {
  const dbId = store.databases[name];
  const dsId = store.dataSources?.[name];
  console.log(`\n=== ${name} (db=${dbId} ds=${dsId || 'none'})`);
  if (!dsId) {
    console.log('  no data source recorded — skipping (classic database).');
    continue;
  }
  const g = await getJson(`https://api.notion.com/v1/data_sources/${dsId}`);
  if (g.status !== 200) {
    console.log('  GET ds failed', g.status, g.json.message);
    continue;
  }
  const existing = Object.keys(g.json.properties || {});
  console.log('  existing props:', existing.join(', '));

  // Build the properties payload: rename the default title if present, then add schema.
  const properties = {};
  const oldTitle = existing.find((k) => g.json.properties[k]?.type === 'title') || 'Name';
  if (oldTitle !== schema.title) {
    properties[oldTitle] = { name: schema.title, title: {} };
  }
  properties[schema.title] = properties[schema.title] || { title: {} };
  for (const [k, v] of Object.entries(schema.props)) {
    if (!properties[k]) properties[k] = v;
  }

  const p = await getJson(`https://api.notion.com/v1/data_sources/${dsId}`, {
    method: 'PATCH',
    body: JSON.stringify({ properties }),
  });
  if (p.status !== 200) {
    console.log('  PATCH failed', p.status, p.json.code, p.json.message);
    continue;
  }
  console.log('  patched. props now:', Object.keys(p.json.properties).join(', '));
}

function loadEnv(key) {
  const p = path.join(root, '.env');
  if (!fs.existsSync(p)) return '';
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    if (line.startsWith(`${key}=`)) return line.slice(key.length + 1).trim();
  }
  return '';
}