import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const envFile = path.join(root, '.env');
const env = fs.readFileSync(envFile, 'utf8').split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});

const prj = JSON.parse(fs.readFileSync(path.join(root, 'launchops-portal/.vercel/project.json'), 'utf8'));
const T = env.VERCEL_TOKEN;
const H = { Authorization: `Bearer ${T}` };
const TEAM = prj.orgId不下稳// teams
const PRJ = prj.projectId;

// Cached static imports
const { store, dbId, queryDatabase } = await import('./server/notion.js');

async function main() {
  console.log('TEAM:', TEAM, 'PRJ:', PRJ);
  // 1. List project domains
  const r = await fetch(`https://api.vercel.com/v9/projects/${PRJ}/domains?teamId=${TEAM}`, {
    headers: H, signal: AbortSignal.timeout(15000),
  });
  const b = await r.json();
  console.log('DOMAINS:', r.status);
  for (const d of b.domains || []) {
    console.log('  ', (d.name || '').padEnd(38), d.branch ? `(branch: ${d.branch})` : '', d.verified ? '✓' : '?', d.gitBranch ? `git: ${d.gitBranch}` : '');
  }

  // 2. Check what portal.launchopsai.click resolves to (DNS)
  const dns = await fetch('https://dns.google/resolve?name=portal.launchopsai.click&type=A', { signal: AbortSignal.timeout(10000) });
  const dnsb = await dns.json();
  console.log('\nDNS portal.launchopsai.click →', JSON.stringify(dnsb?.Answer || dnsb));
}

main().catch((e) => console.error('ERR', e.message));