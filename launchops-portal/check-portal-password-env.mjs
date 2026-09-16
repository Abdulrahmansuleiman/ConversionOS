// Compare local PORTAL_PASSWORD (.env) vs what the DEPLOYED portal has on Vercel.
// RO-only unless --fix. Prints only sha256-prefix hashes, never raw secrets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envFile = path.join(root, '.env');
const envTxt = fs.readFileSync(envFile, 'utf8');
const env = envTxt.split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});

const localPass = env.PORTAL_PASSWORD;
const token = env.VERCEL_TOKENavenique;
if (!localPass) { console.log('LOCAL .env has NO PORTAL_PASSWORD.'); process.exit(1); }
if (!token) { console.log('LOCAL .env has NO VERCEL_TOKEN.'); process.exit(1); }
const prj = JSON.parse(fs.readFileSync(path.join(__dirname, '.vercel', 'project.json'), 'utf8'));
const PRJ = prj.projectId;
const TEAM = prj.orgId;
const H = { Authorization: `Bearer ${token}` };
const hash8 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 8);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const api = async (url, opts = {}) => {
  const r = await fetch(url, { ...opts, headers: { ...H, ...(opts.headers || {}) }, signal: AbortSignal.timeout(20000) });
  return { status: r.status, b: await r.json() };
};
const DO_FIX = process.argv.includes('--fix');

(async () => {
  console.log('local PORTAL_PASSWORD set:', Boolean(localPass), '| sha8:', hash8(localPass));
  const e = await api(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`);
  const list = Array.isArray(e.b) ? e.b : (Array.isArray(e.b?.envs) ? e.b.envs : []);
  const pw = list.find?.((v) => v.key === 'PORTAL_PASSWORD');
  console.log('\nVercel env PORTAL_PASSWORD:', pw ? `present | sha8: ${hash8(String(pw.value))} | targets: ${(pw.target || []).join(',')}` : 'MISSING on Vercel');
  const match = pw && hash8(String(pw.value)) === hash8(localPass);
  console.log('\nMATCH:', match ? 'YES - local == deployed' : pw ? 'NO - deployed differs from local (this is why incorrect)' : 'NO - not deployed at all (this is why incorrect)');

  if (DO_FIX) {
    console.log('\nFIXING: setting PORTAL_PASSWORD on Vercel = local, then redeploying');
    let req;
    if (pw) {
      req = await api(`https://api.vercel.com/v9/projects/${PRJ}/env/${pw.id}?teamId=${TEAM}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'PORTAL_PASSWORD', value: localPass, type: 'encrypted', target: ['production', 'preview', 'development'] }) });
    } else {
      req = await api(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: 'PORTAL_PASSWORD', value: localPass, type: 'encrypted', target: ['production', 'preview', 'development'] }) });
    }
    console.log('upsert status:', req.status, req.b?.error?.code || '');
    // trigger redeploy so prod picks the fix up
    const token2 = crypto.randomBytes(8).toString('hex');
    // git-push-free: use Vercel redeploy endpoint
    const dep = await api(`https://api.vercel.com/v13/deployments/${process.argv[2] || ''}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
  }
})().catch((e) => console.log('FATAL:', e.message));
