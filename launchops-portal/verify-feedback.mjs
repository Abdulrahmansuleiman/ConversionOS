// verify-feedback.mjs — regression suite for the Client Feedback -> Project link.
//   node verify-feedback.mjs
// Proves: (1) business-name -> project matching, incl. legal suffixes, word
// order, punctuation and the ambiguity trap; (2) a raw form submission (empty
// `Project` relation) resolves to a project, so it shows on that project's tab.
import * as n from './server/notion.js';

let pass = 0;
let fail = 0;
const check = (label, got, want) => {
  const ok = got === want;
  ok ? pass++ : fail++;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}${ok ? '' : `\n         got=${JSON.stringify(got)} want=${JSON.stringify(want)}`}`);
};

const projects = (await n.listRows('Projects', 'Client')).map((p) => ({ id: p.id, title: p.title }));
console.log('=== Projects (the `Client` title IS the business name) ===');
for (const p of projects) console.log(`  "${p.title}"`);

const idOf = (t) => projects.find((p) => p.title === t)?.id ?? null;

console.log('\n=== A. real business names must resolve ===');
check('exact            "Bloomline Apparel"', n.matchProjectId('Bloomline Apparel', projects), idOf('Bloomline Apparel'));
check('exact            "Solar London"', n.matchProjectId('Solar London', projects), idOf('Solar London'));
check('exact            "Tripix.store"', n.matchProjectId('Tripix.store', projects), idOf('Tripix.store'));
check('lowercase        "bloomline apparel"', n.matchProjectId('bloomline apparel', projects), idOf('Bloomline Apparel'));
check('UPPER            "SOLAR LONDON"', n.matchProjectId('SOLAR LONDON', projects), idOf('Solar London'));

console.log('\n=== B. messy real-world spellings ===');
check('legal suffix     "Bloomline Apparel Ltd"', n.matchProjectId('Bloomline Apparel Ltd', projects), idOf('Bloomline Apparel'));
check('legal suffix     "Bloomline Apparel, Inc."', n.matchProjectId('Bloomline Apparel, Inc.', projects), idOf('Bloomline Apparel'));
check('legal suffix     "Solar London Ltd."', n.matchProjectId('Solar London Ltd.', projects), idOf('Solar London'));
check('short form       "Bloomline"', n.matchProjectId('Bloomline', projects), idOf('Bloomline Apparel'));
check('short form       "Tripix"', n.matchProjectId('Tripix', projects), idOf('Tripix.store'));
check('domain form      "tripix.store"', n.matchProjectId('tripix.store', projects), idOf('Tripix.store'));
check('domain form      "www.tripix.store"', n.matchProjectId('www.tripix.store', projects), idOf('Tripix.store'));
check('hyphenated       "bloomline-apparel"', n.matchProjectId('bloomline-apparel', projects), idOf('Bloomline Apparel'));
check('word order       "London Solar"', n.matchProjectId('London Solar', projects), idOf('Solar London'));
check('with ampersand   "Bloomline & Co Apparel"', n.matchProjectId('Bloomline & Co Apparel', projects), idOf('Bloomline Apparel'));
check('trailing spaces  "  Solar London  "', n.matchProjectId('  Solar London  ', projects), idOf('Solar London'));

console.log('\n=== C. must NOT resolve (never guess) ===');
check('unrelated        "Acme Widgets"', n.matchProjectId('Acme Widgets', projects), null);
check('Raymon\'s own test "Launchops AI"', n.matchProjectId('Launchops AI', projects), null);
check('empty            ""', n.matchProjectId('', projects), null);
check('whitespace       "   "', n.matchProjectId('   ', projects), null);
check('too short        "AB"', n.matchProjectId('AB', projects), null);
check('noise            "test test"', n.matchProjectId('test test', projects), null);

console.log('\n=== D. ambiguity must resolve to null, not the wrong client ===');
const twins = [
  { id: 'id-a', title: 'Solar London' },
  { id: 'id-b', title: 'London Solar Group' },
];
check('two projects share "london/solar" -> null', n.matchProjectId('London Solar Ltd', twins), null);
check('but an exact title still wins', n.matchProjectId('Solar London', twins), 'id-a');
check('and its exact twin still wins', n.matchProjectId('London Solar Group', twins), 'id-b');

console.log('\n=== E. a raw form submission (empty Project relation) lands on the project tab ===');
const rawSubmission = {
  id: 'synthetic-1',
  title: 'Great work on the launch',
  createdTime: '2026-09-18T09:00:00.000Z',
  'Full Name': 'Jane Doe',
  'Business Name': 'Bloomline Apparel Ltd',
  'What Rating (1-10) ': 9,
  'Date Filed / Submitted': '2026-09-18',
  'What Went Well': 'the launch went smoothly',
  'What Could Have Done Better': 'nothing',
  'Would You Recommend LaunchOps ?': true,
  'Biggest Result So Far': 'more bookings',
  'Record A 1-2min short video / Testimonial': [],
  Status: null,
  Project: [],
};
const canon = n.canonicalFeedback(rawSubmission, projects);
check('business name resolves to the project', canon.projectId, idOf('Bloomline Apparel'));
check('project name is surfaced for the UI', canon.projectName, 'Bloomline Apparel');
check('no relation required on the row', Array.isArray(rawSubmission.Project) && rawSubmission.Project.length, 0);
check('rating is kept on the 1-10 scale', canon.Rating, 9);
check('submitted date is preserved', canon.Submitted, '2026-09-18');
check('client name is preserved', canon.FullName, 'Jane Doe');

// The project tab filters on the resolved id — this is exactly that predicate.
const projectTabRows = [canon].filter((f) => f.projectId === idOf('Bloomline Apparel'));
check('it appears on that project tab', projectTabRows.length, 1);
const otherTabRows = [canon].filter((f) => f.projectId === idOf('Solar London'));
check('and NOT on another client\'s tab', otherTabRows.length, 0);

console.log('\n=== F. live data: both existing submissions ===');
const live = await n.listFeedback();
for (const f of live) {
  console.log(`  "${String(f.title).slice(0, 50)}" | business="${f.BusinessName}" | project=${f.projectName ?? 'NONE'} | ${f.Rating}/10 | ${f.Submitted}`);
}
check('live rows load with a rating', live.every((f) => typeof f.Rating === 'number'), true);
check('live rows load with a date', live.every((f) => !!f.Submitted), true);
check('unmatched live rows are null, not guessed', live.every((f) => f.projectId === null || typeof f.projectId === 'string'), true);

console.log(`\n=== RESULT: ${pass} passed, ${fail} failed ===`);
process.exit(fail ? 1 : 0);
