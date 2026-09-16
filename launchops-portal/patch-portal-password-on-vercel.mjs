// PATCH the EXISTING (empty) PORTAL_PASSWORD env entry on the launchops-portal
// Vercel project to match the local .env value. Prints sha6 prefixes only.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envTxt = fs.readFileSync(path.join(root, '.env'), 'utf8');
const env = envTxt.split('\n').reduce((o, l) => { const i = l.indexOf('='); if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim(); return o; }, {});
const pass = env.PORTAL_PASSWORD;
const T = env.VERCEL_TOKEN;
const prj = JSON.parse(fs.readFileSync(path.join(__dirname, '.vercel/project.json'), 'utf8'));
const PRJ = prj.projectId;
const TEAM = prj.orgId;
const h6 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 6);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const H = { Authorization: `Bearer ${T}` };
const api = async (u, o = {}) => {
  const r = await fetch(u, { ...o, headers: { ...H, ...(o.headers || {}) }, signal: AbortSignal.timeout(20000) });
  return { status: r.status, b: await r.json() };
};

(async () => {
  if (!pass) throw new Error('local PORTAL_PASSWORD empty — nothing to sync');
  console.log('local  PORTAL_PASSWORD sha6:', h6(pass), '(len', pass.length + ')');

  // 1. List existing env entries (read-only).
  const j = await api(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`);
  const envs = (j.b?.envs || []).filter((v) => v.key === 'PORTAL_PASSWORD');
  console.log('existing PORTAL_PASSWORD entries:', envs.length);
  for (const v of envs) console.log('  id', v.id.slice(0, 8), '| value sha6:', h6(v.value || ''), '| targets:', (v.target || []).join(','));
  const prod = envs.find((v) => (v.target || []).includes('production'));
  if (!prod) throw new Error('no production PORTAL_PASSWORD entry to patch');

  // 2. PATCH the production entry's value to the local value.
  const body = { key: 'PORTAL_PASSWORD', value: pass, type: 'encrypted', target: ['production', 'preview', 'development'] };
  const p = await api(`https://api.vercel.com/v9/projects/${PRJ}/env/${prod.id}?teamId=${TEAM}`, {
    method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  console.log('PATCH status:', p.status, p.status === 200 ? '| ok' : '| ' + JSON.stringify(p.b).slice(0, 120));

  // 3. Verify.
  await sleep(700);
  const v = await api(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`);
  const prodAfter = (v.b?.envs || []).find((x) => x.key === 'PORTAL_PASSWORD' && (x.target || []).includes('production'));
  const match = prodAfter && h6(prodAfter.value || '') === h6(pass);
  console.log('\nAFTER: prod PORTAL_PASSWORD sha6:', prodAfter ? h6(prodAfter.value || '') : '(gone)', '| matches local?', match ? 'YES' : 'NO');

  if (!match) { console.log('\nNOT synced — will NOT redeploy until it matches.'); return; }
  console.log('\nSYNCED. Now redeploy so prod picks it up (separate step, push empty commit to trigger).');
})().catch((e) => console.log('FATAL:', e.message));
