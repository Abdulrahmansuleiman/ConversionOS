#!/usr/bin/env node
// scripts/set-vercel-env.mjs
// Sets NOTION_TOKEN + PORTAL_PASSWORD on the Vercel project for production.
// Reads the CLI auth token (already cached by `vercel login`) + values from .env.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');

const authPath = process.env.VERCEL_AUTH_PATH || path.join(process.env.APPDATA || '', 'xdg.data', 'com.vercel.cli', 'auth.json');
const auth = JSON.parse(fs.readFileSync(authPath, 'utf8'));
const token = auth.token;

const envFile = path.join(root, '.env');
const read = (k) => {
  const line = fs.readFileSync(envFile, 'utf8').split(/\r?\n/).find((l) => l.startsWith(`${k}=`));
  return line ? line.slice(k.length + 1).trim() : '';
};

const values = { NOTION_TOKEN: read('NOTION_TOKEN'), PORTAL_PASSWORD: read('PORTAL_PASSWORD') };

const project = process.env.VERCEL_PROJECT || 'launchops-portal';

async function api(pathname, method = 'GET', body) {
  const res = await fetch(`https://api.vercel.com${pathname}`, {
    method,
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(30000),
  });
  return { status: res.status, json: await res.json() };
}

const envId = { NOTION_TOKEN: process.env.VERCEL_ENV_ID_NOTION_TOKEN, PORTAL_PASSWORD: process.env.VERCEL_ENV_ID_PORTAL_PASSWORD };

for (const [key, value] of Object.entries(values)) {
  const r = await api(
    envId[key] ? `/v10/projects/${project}/env/${envId[key]}` : `/v10/projects/${project}/env`,
    envId[key] ? 'PATCH' : 'POST',
    { key, value, type: 'encrypted', target: ['production'] },
  );
  console.log(`${key} -> status ${r.status} ${r.json.key ? `ok (${r.json.key}${envId[key] ? ' patched' : ''})` : JSON.stringify(r.json)}`);
}

const ls = await api(`/v10/projects/${project}/env?target=production`);
console.log('project envs:', (ls.json.envs || []).map((e) => e.key).join(', ') || ls.status);