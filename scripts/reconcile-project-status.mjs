// scripts/reconcile-project-status.mjs
// Heal every project's Projects.Status from its roadmap, in Notion.
//
// Use this any time you suspect drift — after a bulk edit, after importing a
// client, or right after a deploy. Idempotent: it only writes rows whose stored
// Status disagrees with what the roadmap proves.
//
//   node scripts/reconcile-project-status.mjs            # report + heal
//   node scripts/reconcile-project-status.mjs --dry-run  # report only
//
// Exit code 1 if any project still disagrees after the heal (fail loud).
import { listRows, updateRow } from '../launchops-portal/server/notion.js';
import { DB } from '../launchops-portal/server/schemas.js';
import { deriveProjectStatus, isCompleteMilestone } from '../launchops-portal/server/status.js';

const dryRun = process.argv.includes('--dry-run');

const [projects, milestones] = await Promise.all([
  listRows('Projects', DB.Projects.titleKey, { sorts: [{ property: 'Client', direction: 'ascending' }] }),
  listRows('Roadmap', DB.Roadmap.titleKey),
]);

const byProject = new Map();
for (const m of milestones) {
  for (const pid of m.Project || []) {
    if (!byProject.has(pid)) byProject.set(pid, []);
    byProject.get(pid).push(m);
  }
}

let healed = 0;
let failed = 0;
const unlinked = milestones.filter((m) => !(m.Project || []).length);

for (const p of projects) {
  const ms = byProject.get(p.id) || [];
  const done = ms.filter((m) => isCompleteMilestone(m.Status)).length;
  const derived = deriveProjectStatus(p.Status, ms);
  const needsFix = derived && derived !== p.Status;

  const label = `${p.title} — ${done}/${ms.length} stages complete`;
  if (!needsFix) {
    console.log(`ok      ${label} | Status: ${p.Status}`);
    continue;
  }

  if (dryRun) {
    console.log(`WOULD   ${label} | ${p.Status} -> ${derived}`);
    continue;
  }

  try {
    await updateRow(p.id, { Status: derived }, DB.Projects.props);
    healed++;
    console.log(`healed  ${label} | ${p.Status} -> ${derived}`);
  } catch (e) {
    failed++;
    console.error(`FAILED  ${label} | ${p.Status} -> ${derived} : ${e.message}`);
  }
}

if (unlinked.length) {
  console.warn(`\nWARN: ${unlinked.length} roadmap row(s) have no Project relation and cannot affect any status:`);
  for (const m of unlinked) console.warn(`  - ${JSON.stringify(m.title)} (${m.Phase}) ${m.Status}`);
}

console.log(`\n${dryRun ? 'DRY RUN — nothing written.' : `${healed} project(s) healed.`}${failed ? ` ${failed} failed.` : ''}`);
process.exit(failed ? 1 : 0);
