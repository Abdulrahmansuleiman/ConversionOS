// Set PORTAL_PASSWORD on the launchops-portal Vercel project (prod) from
// the local .env value so the deployed login stops erroring. Then redeploy sync.
// Prints only sha256-prefix confirms. Never raw. Run: node set-portal-password-on-vercel.mjs
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
const pass = env.PORTAL_PASSWORD;
const token = env.VERCEL_TOKEN;
const h6 = (s) => crypto.createHash('sha256').update(String(s)).digest('hex').slice(0, 6);
const prj = JSON.parse(fs.readFileSync(path.join(__dirname, '.vercel/project.json'), 'utf8'));
const PRJ = prj.projectId;
const TEAM = prj.orgId;
const A = { Authorization: `Bearer ${token}` };

async function api(url, o = {}) {
  const r = await fetch(url, { ...o, headers: { ...A, ...(o.headers || {}) }, signal: AbortSignal.timeout(20000) });
  return { status: r.status, b: await r.json() };
}

(async () => {
  if (!pass) throw new Error('.env has no PORTAL_PASSWORD');
  console.log('local PORTAL_PASSWORD sha6:', h6(pass), '| length:', pass.length);

  // Create (or update) the env var on the Vercel project for production.
  const body = { key: 'PORTAL_PASSWORD', value: pass, type: 'encrypted', target: ['production'] };
  let r = await api(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (r.status === 202) console.log('env created -> id', r.b?.id?.slice(0, 8));
  else if (r.status === 200 && r.b?.envs?.length) {
    const id = r.b.envs[0].id;
    console.log('env existed, updating -> id', id.slice(0, 8));
    r = await api(`https://api.vercel.com/v9/projects/${PRJ}/env/${id}?teamId=${TEAM}`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
  } else {
    console.log('unexpected status', r.status, JSON.stringify(r.b).slice(0, 160));
  }

  // Verify it is now on Vercel (compare hash prefixes only).
  const list = await api(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`);
  const e = (list.b?.envs || []).find((v) => v.key === 'PORTAL_PASSWORD');
  console.log('\nON VERCEL NOW:', e ? `PORTAL_PASSWORD sha6=${h6(e.value || '')} -> set to same as local? ${h6(e.value || '') === h6(pass) ? 'YES' : 'NO'}` : 'STILL MISSING');

  // Trigger production redeploy so the portal picks it up.
  console.log('\nTo make prod pick it up, a new production deployment is needed.');
  console.log('Done setting env. Push a trigger commit or run the redeploy script next.');
})().catch((e) => console.log('FATAL:', e.message));
