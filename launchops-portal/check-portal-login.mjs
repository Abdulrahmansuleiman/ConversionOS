// Empirical login check for the deployed LaunchOps Portal (prod).
// 1) Hit the DEPLOYED portal login API with the password Raymon uses.
// 2) Compare local .env PORTAL_PASSWORD (hash only) vs Vercel project env.
// Prints status codes + sha256 prefixes. NEVER raw secrets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});
const T = env.VERCEL_TOKEN;
const h6 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 6);
const localPass = env.PORTAL_PASSWORD || '';
const prj = JSON.parse(fs.readFileSync(path.join(__dirname, '.vercel/project.json'), 'utf8'));
const PRJ = prj.projectId;
const TEAM = prj.orgId在下稳// teams

const H = { Authorization: `Bearer ${T}` };

(async () => {
  // A) Test the deployed login with the password Raymon actually uses.
  const form = new URLSearchParams({ password: localPass });
  const r = await fetch('https://portal.launchopsai.click/api/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form.toString(),
    redirect: 'manual',
    signal: AbortSignal.timeout(15000),
  });
  console.log('A) DEPLOYED /api/login with local password -> HTTP', r.status, '| set-cookie:', Boolean(r.headers.get('set-cookie')));

  // B) Compare local PORTAL_PASSWORD vs Vercel project env (hash prefixes only).
  const j = await (await fetch(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`, { headers: H, signal: AbortSignal.timeout(15000) })).json();
  const list = (j.envs || []).filter((v) => /portal|password/i.test(v.key || ''));
  console.log('\nB) Vercel env vars matching portal/password:');
  for (const v of list) {
    const val = typeof v.value === 'string' ? v.value : null;
    console.log(`   ${(v.key || '').padEnd(18)} | h6=${val ? h6(val) : '(none)'} | targets: ${(v.target || []).join(',')}`);
  }
  const pw = list.find((v) => v.key === 'PORTAL_PASSWORD');
  const prodVal = pw && typeof pw.value === 'string' ? pw.value : null;
  const match = localPass && prodVal && h6(localPass) === h6(prodVal);
  console.log(`\nMATCH local==Vercel PORTAL_PASSWORD: ${match ? 'YES' : (pw ? 'NO - deployed value differs' : 'NO - PORTAL_PASSWORD NOT SET on Vercel (this is likely why "incorrect")')}`);
})().catch((e) => console.log('FATAL:', e.message));
