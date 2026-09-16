// Redeploy launchops-portal production from the already-pushed git SHA 3c468ad
// so Vercel injects the NEW (non-empty) PORTAL_PASSWORD env at build time.
// Uses the same API the git integration uses; no git push required.
// Prints deployment status/URL only. Reads token from .env at runtime.
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
if (!TOKEN) throw new Error('VERCEL_TOKEN not found in .env');

const prj = JSON.parse(fs.readFileSync(path.join(__dirname, '.vercel/project.json'), 'utf8'));
const PRJ = prj.projectId;
const TEAM = prj.orgId;
const Q = `?teamId=${TEAM}`;
const H = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const SHA = '3c468ad';

async function api(u, o = {}) {
  const r = await fetch(u, { ...o, headers: { ...H, ...(o.headers || {}) }, signal: AbortSignal.timeout(30000) });
  return { status: r.status, b: await r.json() };
}

(async () => {
  // 1. Get repoId from the project's git link.
  const p = await api(`https://api.vercel.com/v9/projects/${PRJ}${Q}`);
  const link = p.b?.link;
  console.log('project:', p.b?.name, '| link type:', link?.type, '| repoId:', link?.repoId ?? '(none)');
  if (!link || !link.repoId) {
    console.log('no git link — falling back to dir-upload deploy is NOT needed; checking deployments instead');
    return;
  }

  // 2. Create a production deployment of the pushed SHA.
  const body = {
    name: 'launchops-portal',
    project: 'launchops-portal',
    target: 'production',
    gitSource: { type: 'github', repoId: link.repoId, ref: 'main', sha: SHA },
  };
  const d = await api(`https://api.vercel.com/v13/deployments${Q}`, { method: 'POST', body: JSON.stringify(body) });
  console.log('deploy status:', d.status, d.status === 200 || d.status === 201 ? 'CREATED' : JSON.stringify(d.b).slice(0, 200));
  const url = d.b?.url || d.b?.deployment?.url || '(n/a)';
  console.log('deployment URL:', url);
  console.log('id:', (d.b?.id || d.b?.deployment?.id || '(n/a)').slice(0, 14));

  // 3. Poll until READY (max ~4 min).
  const id = d.b?.id || d.b?.deployment?.id;
  if (!id) return;
  for (let i = 0; i < 16; i++) {
    await sleep(15000);
    const st = await api(`https://api.vercel.com/v13/deployments/${id}${Q}`);
    const state = st.b?.status || st.b?.readyState || 'unknown';
    console.log(`  ${(i + 1) * 15}s: ${state}`);
    if (state === 'READY' || state === 'ERROR' || state === 'CANCELED') break;
  }
})().catch((e) => console.log('FATAL:', e.message));