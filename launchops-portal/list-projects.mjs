// Live list what the launchops-portal actually shows in its Projects list today,
// so we can identify leftover QA/test junk Raymon sees as "errors".
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url)); // launchops-portal/
const root = path.resolve(__dirname, '..');
const env = fs.readFileSync(path.join(root, '.env'), 'utf8').split('\n').reduce((o, l) => {
  const i = l.indexOf('=');
  if (i > 0) o[l.slice(0, i).trim()] = l.slice(i + 1).trim();
  return o;
}, {});

const { store, dbId, queryDatabase, token } = await import('./server/notion.js');
const st = store();

console.log('token present:', Boolean(token()));
console.log('databases in store:', Object.keys(st.databases || {}).join(', '));

// The portal's Projects list = the Projects database. Query it and print rows.
// Find the projects db name by scanning entries that look like a project store.
const names = Object.keys(st.databases || {});
console.log('candidate project dbs:', names.join(' | '));

for (const name of names) {
  try {
    const rows = await queryDatabase(name);
    if (!rows || !rows.length) { console.log(`\n[${name}] EMPTY`); continue; }
    console.log(`\n[${name}] ${rows.length} rows:`);
    for (const r of rows) {
      const t = r.properties?.Name?.title?.length ? r.properties.Name.title.map(x => x.plain_text).join('') : '(no name)';
      const status = r.properties?.Status?.select?.name || '';
      const created = r.properties?.Created?.date?.start || '';
      console.log('  -', String(t).padEnd(40), '|', String(status).padEnd(14), '|', created);
    }
  } catch (e) {
    console.log(`\n[${name}] ERR:`, e.message.slice(0, 160));
  }
}
