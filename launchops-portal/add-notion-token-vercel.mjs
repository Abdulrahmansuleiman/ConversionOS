// Add NOTION_TOKEN to the launchops-portal Vercel project (encrypted, all
// targets). config.js throws 500 on Vercel without it (root cause of login 500).
// Prints status/length only. Reads value from .env at runtime.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8').split(/\r?\n/).reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});
const TOKEN = env.VERCEL_TOKEN;
const VALUE = env.NOTION_TOKEN;
if (!TOKEN) throw new Error('VERCEL_TOKEN not found in .env');
if (!VALUE) throw new Error('NOTION_TOKEN not found in .env');

const prj = JSON.parse(fs.readFileSync(path.join(__dirname, '.vercel/project.json'), 'utf8'));
const PRJ = prj.projectId;
const TEAM = prj.orgId;
const Q = `?teamId=${TEAM}`;
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(u, o = {}) {
  const r = await fetch(u, { ...o, headers: { ...H, ...(o.headers || {}) }, signal: AbortSignal.timeout(30000) });
  return { status: r.status, b: await r.json() };
}

(async () => {
  console.log('NOTION_TOKEN length:', VALUE.length);

  // 1. Check if already exists.
  const j = await api(`https://api.vercel.com/v9/projects/${PRJ}/env${Q}`);
  const existing = (j.b?.envs || []).filter((v) => v.key === 'NOTION_TOKEN');
  console.log('existing NOTION_TOKEN entries:', existing.length);
  for (const v of existing) console.log('  id', v.id.slice(0, 8), '| type', v.type, '| targets', (v.target || []).join(','));

  // 2. Create (or skip if production already covered).
  const hasProd = existing.some((v) => (v.target || []).includes('production'));
  if (hasProd) {
    console.log('production already has NOTION_TOKEN - no change needed.');
    return;
  }
  const c = await api(`https://api.vercel.com/v9/projects/${PRJ}/env${Q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: 'NOTION_TOKEN',
      value: VALUE,
      type: 'encrypted',
      target: ['production', 'preview', 'development'],
    }),
  });
  console.log('CREATE status:', c.status, c.status === 200 || c.status === 201 ? '(created)' : JSON.stringify(c.b).slice(0, 160));

  // 3. Verify.
  await sleep(800);
  const v = await api(`https://api.vercel.com/v9/projects/${PRJ}/env${Q}`);
  const after = (v.b?.envs || []).filter((x) => x.key === 'NOTION_TOKEN');
  console.log('AFTER: NOTION_TOKEN entries:', after.length);
  for (const x of after) console.log('  id', x.id.slice(0, 8), '| type', x.type, '| targets', (x.target || []).join(','));
  console.log(after.some((x) => (x.target || []).includes('production'))
    ? '\nREADY: production covered. Redeploy next so the build injects it.'
    : '\nNOT covered for production - check status.');
})().catch((e) => console.log('FATAL:', e.message));