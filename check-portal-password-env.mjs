// Diagnose "whyy does portal.launchopsai.click say incorrect for abdul2005":
// compare the LOCAL PORTAL_PASSWORD (.env) against what the VERCEL-hosted
// launchops-portal project actually has in its env vars (source of truth for prod).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const env = fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});

const prj = JSON.parse(fs.readFileSync(path.join(__dirname, 'launchops-portal/.vercel/project.json'), 'utf8'));
const PRJ = prj.projectId;
const TEAM = prj.orgId;
const T = env.VERCEL_TOKENParamCase;
const H = { Authorization: `Bearer ${T}` };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const j = async (u) => { const r = await fetch(u, { headers: H, signal: AbortSignal.timeout(15000) }); return { status: r.status, b: await r.json() }; };

(async () => {
  console.log('LOCAL .env PORTAL_PASSWORD:', JSON.stringify(env.PORTAL_PASSWORD ?? null));
  console.log('Local has it?:', Boolean(env.PORTAL_PASSWORD));
  // List every env var attached to the launchops-portal Vercel project
  const e = await j(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}`);

  // The v9 list endpoint returns a map; find the portal password key.
  const names = {};
  const add = (o) => {
    for (const [k, v] of Object.entries(o || {})) {
      if (typeof v === 'string') names[k] = true;
      else if (v && typeof v === 'object') add(v);
    }
  };
  if (e.status === 200) add(e.b);
  const keys = Object.keys(names).filter((k) => /portal|password|pass/i.test(k));
  console.log('\nVercel project env keys (password-ish):', keys.length ? keys.join(', ') : '(none matched)');

  // Get raw list to read the actual PORTAL_PASSWORD value Vercel holds
  const list = await j(`https://api.vercel.com/v9/projects/${PRJ}/env?teamId=${TEAM}&decrypt=true&brief=true`);
  console.log('\nVercel env raw (passwords only, value lengths):');
  if (list.status === 200 && Array.isArray(list.b.envs)) {
    for (const v of list.b.envs) {
      if (/portal|password|pass/i.test(v.key || '')) {
        console.log(`  ${v.key} = ${JSON.stringify(v.value ?? null)}`);
      }
    }
  } else {
    console.log('  (unexpected shape / non-200:', list.status, JSON.stringify(list.b).slice(0, 160));
  }

  // Hot fix: if Vercel is missing/empty PORTAL_PASSWORD, set it from local.
  const want = env.PORTAL_PASSWORD;
  if (want) {
    const found = Array.isArray(list.b?.envs) && list.b.envs.find((v) => v.key === 'PORTAL_PASSWORD');
    console.log(`\nPROD PORTAL_PASSWORD: ${found ? JSON.stringify(found.value) : '(NOT SET)'}`);
    console.log(`expected (local .env): ${JSON.stringify(want)}`);
    const match = found && found.value === want;
    console.log(`MATCH: ${match ? 'YES — config is identical, look elsewhere' : 'NO — this is why "incorrect"'}`);
  }
  console.log('\nportal.launchopsai.click → which Vercel env? The /env endpoint answers truth.');
})().catch((e) => console.log('FATAL:', e.message));