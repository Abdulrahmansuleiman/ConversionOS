// scripts/test-project-status.mjs
// Permanent regression test for launchops-portal/server/status.js.
//
// Run: node scripts/test-project-status.mjs   (or: npm run test:status)
// Exits non-zero on any failure — wire it into CI so the
// "every stage complete but the portal says In Discovery" bug can never ship
// again.
import { deriveProjectStatus, isCompleteMilestone, canonicalStatus } from '../launchops-portal/server/status.js';

const M = (Phase, Status) => ({ Phase, Status });
const PHASES = ['Kickoff', 'Design', 'Build', 'Review', 'Launch', 'Post-launch support'];
const ALL_DONE = PHASES.map((p) => M(p, 'Complete'));
const ALL_DONE_MINUS_SUPPORT = ALL_DONE.slice(0, 5);
const NONE_DONE = PHASES.map((p) => M(p, 'Not started'));

const cases = [
  // --- the bug Raymon reported -------------------------------------------
  ['all 6 complete, stored In Discovery → Completed', deriveProjectStatus('In Discovery', ALL_DONE), 'Completed'],
  ['all 6 complete, stored null → Completed', deriveProjectStatus(null, ALL_DONE), 'Completed'],
  ['all 6 complete, stored Proposed → Completed', deriveProjectStatus('Proposed', ALL_DONE), 'Completed'],
  ['all 6 complete, stored Live → Completed', deriveProjectStatus('Live', ALL_DONE), 'Completed'],
  ['all 6 complete, stored Completed → Completed', deriveProjectStatus('Completed', ALL_DONE), 'Completed'],
  ['all 6 complete, stored lowercase "completed" → Completed', deriveProjectStatus('completed', ALL_DONE), 'Completed'],

  // --- Launch is the finish line (no post-launch support needed) ---------
  ['Launch complete (support not started), stored In Discovery → Completed', deriveProjectStatus('In Discovery', ALL_DONE_MINUS_SUPPORT), 'Completed'],
  ['Launch complete, stored Live → Completed', deriveProjectStatus('Live', ALL_DONE_MINUS_SUPPORT), 'Completed'],

  // --- custom / renamed phases can never block completion ----------------
  ['all complete with unknown phase names → Completed', deriveProjectStatus('In Discovery', Array.from({ length: 6 }, (_, i) => M(`Phase ${i + 1}`, 'Complete'))), 'Completed'],
  ['all complete, en-dash Post‑launch → Completed', deriveProjectStatus('In Discovery', [M('Kickoff', 'Complete'), M('Post\u2011launch support', 'Complete')]), 'Completed'],

  // --- a truncated roadmap must NOT imply a finished project -------------
  ['single complete stage (truncated roadmap) → its own stage, not Completed', deriveProjectStatus('In Discovery', [M('Kickoff', 'Complete')]), 'Contracted'],

  // --- progression still works mid-flight --------------------------------
  ['only Kickoff complete → Contracted', deriveProjectStatus('In Discovery', [M('Kickoff', 'Complete')]), 'Contracted'],
  ['through Review complete → QA', deriveProjectStatus('In Discovery', ALL_DONE.slice(0, 4)), 'QA'],
  ['only Build complete → Building', deriveProjectStatus('In Discovery', [M('Build', 'Complete')]), 'Building'],

  // --- nothing started: stored is truth ----------------------------------
  ['no milestones, stored In Discovery → In Discovery', deriveProjectStatus('In Discovery', []), 'In Discovery'],
  ['no milestones, stored null → null', deriveProjectStatus(null, []), null],
  ['all open, stored In Discovery → In Discovery', deriveProjectStatus('In Discovery', NONE_DONE), 'In Discovery'],
  ['all open, stored Contracted → Contracted', deriveProjectStatus('Contracted', NONE_DONE), 'Contracted'],

  // --- manual statuses ---------------------------------------------------
  ['stored custom status preserved before any completion', deriveProjectStatus('On hold', NONE_DONE), 'On hold'],
  ['stored custom status preserved with partial progress', deriveProjectStatus('On hold', [M('Kickoff', 'Complete')]), 'On hold'],

  // --- hygiene -----------------------------------------------------------
  ['in progress stages prove nothing', deriveProjectStatus('In Discovery', [M('Kickoff', 'In progress')]), 'In Discovery'],
  ['undefined milestones handled', deriveProjectStatus('In Discovery', undefined), 'In Discovery'],
];

let failed = 0;
for (const [name, actual, expected] of cases) {
  const ok = actual === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${ok ? '' : `  (got ${JSON.stringify(actual)}, want ${JSON.stringify(expected)})`}`);
}

// isCompleteMilestone
const completeCases = [
  ['Complete', true],
  ['completed', true],
  [' done ', true],
  ['In progress', false],
  ['Not started', false],
  [null, false],
  [undefined, false],
];
for (const [input, expected] of completeCases) {
  const ok = isCompleteMilestone(input) === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  isCompleteMilestone(${JSON.stringify(input)}) === ${expected}`);
}

// canonicalStatus
const canonCases = [
  ['completed', 'Completed'],
  ['LIVE', 'Live'],
  ['in discovery', 'In Discovery'],
  ['On hold', 'On hold'],
];
for (const [input, expected] of canonCases) {
  const ok = canonicalStatus(input) === expected;
  if (!ok) failed++;
  console.log(`${ok ? 'PASS' : 'FAIL'}  canonicalStatus(${JSON.stringify(input)}) === ${JSON.stringify(expected)}`);
}

console.log(failed ? `\n${failed} FAILED` : `\nAll ${cases.length + completeCases.length + canonCases.length} checks passed.`);
process.exit(failed ? 1 : 0);
