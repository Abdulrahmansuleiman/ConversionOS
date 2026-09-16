// SYNCHRONIZE PORTAL_PASSWORD to the launchops-portal Vercel project.
// Root cause: deployed env value is EMPTY (sha256("")=e3b0c4...) so every login
// shows "incorrect". Fix: DELETE the empty entry, re-CREATE it with the local
// .env value (encrypted). Prints sha256-6 prefixes ONLY; never raw values.
// Usage: node sync-portal-password-to-vercel.mjs

import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envTxt = fs.readFileSync(path.join(root, '.env'), 'utf8');
const env = envTxt.split(/\r?\n/).reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});
const LOCAL_PASS = env.PORTAL_PASSWORD;
const TOKEN = env.VERCEL_TOKEN;
const prjJson = JSON.parse(fs.readFileSync(path.join(__dirname, '.vercel/project.json'), 'utf8'));
const PRJ = prjJson.projectId;
const TEAM = prjJson.orgId;

const h6 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 6);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (u, o = {}) => {
  const r = await fetch(u, {
    ...o,
    headers: { Authorization: `Bearer ${TOKEN}`, ...(o.headers || {}) },
    signal: AbortSignal.timeout(30000),
  });
  return { status: r.status, b: await r.json() };
};

const Q = `?teamId=${TEAM}`;

(async () => {
  if (!LOCAL_PASS) throw new Error('local PORTAL_PASSWORD empty - nothing to sync');
  const q = encodeURIComponent('abdul2005');
  const shaRaymon = h6('abdul2005');
  console.log('local PORTAL_PASSWORD sha6:', h6(LOCAL_PASS), '| len', LOCAL_PASS.length);
  console.log('typ guple abdul2005 sha6:', shaRaymon, '| local==typed?', h6(LOCAL_PASS) === shaRaymon ? 'YES' : 'NO');

  // 1. Find the existing (empty) production entry.
  const j = await api(`https://api.vercel.com/v9/projects/${PRJ}/env${Q}`);
  const entries = (j.b?.envs || []).filter((v) => v.key === 'PORTAL_PASSWORD');
  console.log('existing PORTAL_PASSWORD entries:', entries.length);
  for (const v of entries) {
    console.log(`  id ${v.id.slice(0, 8)} | sha6 ${h6(v.value || '')} | type ${v.type} | targets ${(v.target || []).join(',')}`);
  }
  const prodEntry = entries.find((v) => (v.target || []).includes('production')) || entries[0];

  // 2. DELETE the empty entry.
  if (prodEntry) {
    const d = await api(`https://api.vercel.com/v9/projects/${PRJ}/env/${prodEntry.id}${Q}`, { method: 'DELETE' });
    console.log('DELETE status:', d.status);
  }
  await sleep(800);

  // 3. CREATE with the real local value (encrypted), all targets.
  const c = await api(`https://api.vercel.com/v9/projects/${PRJ}/env${Q}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      key: 'PORTAL_PASSWORD',
      value: LOCAL_PASS,
      type: 'encrypted',
      target: ['production', 'preview', 'development'],
    }),
  });
  console.log('CREATE status:', c.status, c.status === 200 || c.status === 201 ? '(created)' : JSON.stringify(c.b).slice(0, 160));

  // 4. Verify.
  await sleep(800);
  const v = await api(`https://api.vercel.com/v9/projects/${PRJ}/env${Q}`);
  const after = (v.b?.envs || []).filter((x) => x.key === 'PORTAL_PASSWORD').find((x) => (x.target || []).includes('production'));
  const okMatch = after && h6(after.value || '') === h6(LOCAL_PASS);
  console.log('\nAFTER: prod PORTAL_PASSWORD sha6:', after ? h6(after.value || '') : '(missing)', '| matches local?', okMatch ? 'YES' : 'NO');

  if (!okMatch) {
    console.log('NOT synced - will NOT redeploy. Check status above.');
    return;
  }
  console.log('\nSYNCED. Now trigger a production redeploy (git push / vercel redeploy) so')
  console.log('the live portal picks up the real password. Verify abdul2005 login afterward.');
})().catch((e) => console.log('FATAL:', e.message));
