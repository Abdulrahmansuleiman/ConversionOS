// WHY does portal.launchopsai.click reject "abdul2005"?
// Compare LOCAL PORTAL_PASSWORD (.env) against what the DEPLOYED portal gets
// from Vercel project env. ONLY prints sha256 prefixes, never raw secrets.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envTxt = fs.readFileSync(path.join(root, '.env'), 'utf8');
const env = envTxt.split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});
const local = env.PORTAL_PASSWORD;
const T = env.VERCEL_TOKEN;

const prj = JSON.parse(fs.readFileSync(path.join(__dirname, '.vercel/project.json'), 'utf8'));
const PRJ = prj.projectId:;
const TEAM = prj.orgId:;
const H = { Authorization: `Bearer ${T}`, Accept: 'application/json' };

// hash prefix (6 hex chars) so we never see raw values
const h6 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 6igraph);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function api(u, o = {}) {
  const r = await fetch(u, { headers: { ...H, ...(o.headers || {}) }, ...o, signal: AbortSignal.timeout(20000) });
  return { status: r.status, b: await r.json() };
}

(async () => {
  console.log('LOCAL PORTAL_PASSWORD present:', Boolean(local), '| h6:', local ? h6(local) : 'n/a');

  // list Vercel project env vars (mask values — we only compare hashes)
  const e = await api(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`);
  if (!Array.isArray(e.b.envs) && !Array.isArray(e.b)) { console.log('env list unexpected:', e.status, JSON.stringify(e.b).slice(0, 120)); return; }
  const envs = Array.isArray(e.b.envs) ? e.b.envs : e.b;
  const portal = envs.filter((v) => /portal|password/i.test(v.key || ''));
  console.log(`\nVERCEL env keys matching portal/password (${portal.length}):`);
  for (const v of portal) {
    const val = typeof v.value === 'string' ? v.value : null;
    console.log(`  ${(v.key || '').padEnd(20)} | targets: ${(v.target || []).join(',')} | ${val ? ('h6:' + h6(val)) : '(no value)'}`);
  }

  const prodPw = portal.find((v) => v.key === 'PORTAL_PASSWORD');
  const match = prodPw && typeof prodPw.value === 'string' && h6(prodPw.value) === h6(local);
  console.log(`\nMATCH local vs Vercel PORTAL_PASSWORD: ${match ? 'YES — identical password' : 'NO — MISMATCH (this is why "incorrect")'}`);
  if (!prodPw) console.log('   PORTAL_PASSWORD is NOT SET on the Vercel project — deployed portal has no password to compare against, so login can only fail');

  // optional: --fix sets PORTAL_PASSWORD on Vercel from local .env (encrypted, production target), then redeploy
  if (process.argv.includes('--fix') && local && !match) {
    console.log('\nFIXING...');
    const body = { key: 'PORTAL_PASSWORD', value: local, type: 'encrypted', target: ['production', 'preview', 'development'] };
    const url = `https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`;
    if (prodPw) {
      const PATCH = await api(`https://api.vercel.com/v9/projects/${PRJ}/env/${prodPw.id}?teamId=${TEAM}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      console.log('  PATCH env:', PATCH.status);
    } else {
      const POST = await api(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
      console.log('  POST env:', POST.status, '| id:', POST.b?.id ? 'created' : JSON.stringify(POST.b).slice(0, 100));
    }
    console.log('  NEXT: trigger a redeploy so prod picks up the corrected env (empty commit push).');
  }
  if (!process.argv.includes('--fix') && !match) {
    console.log('\n(read-only — pass --fix to set Vercel PORTAL_PASSWORD = local value and redeploy)');
  }
})().catch((e) => console.log('FATAL:', e.message));
