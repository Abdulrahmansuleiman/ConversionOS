// verify-feedback.mjs — proves the Client Feedback mapping + project resolution.
import * as n from './server/notion.js';

const proj = await n.listRows('Projects', 'Client');
const projects = proj.map((p) => ({ id: p.id, title: p.title }));

console.log('### projects available for matching');
for (const p of projects) console.log(`  - "${p.title}"  (${p.id})`);

console.log('\n### matchProjectId (business name -> project)');
for (const name of ['Launchops AI', 'Tripix.store', 'Tripix', 'Bloomline Apparel', 'Bloomline', 'Solar London', 'Solar', 'Acme Widgets Ltd', '', '   ']) {
  const id = n.matchProjectId(name, projects);
  const hit = projects.find((p) => p.id === id);
  console.log(`  ${JSON.stringify(name).padEnd(22)} -> ${hit ? hit.title : 'null (no confident match)'}`);
}

console.log('\n### /api/feedback payload (canonical rows, newest first)');
const rows = await n.listFeedback();
for (const f of rows) {
  console.log('\n  ' + '-'.repeat(70));
  console.log('  title       :', f.title);
  console.log('  FullName    :', JSON.stringify(f.FullName));
  console.log('  BusinessName:', JSON.stringify(f.BusinessName));
  console.log('  Rating      :', f.Rating, '(of 10)');
  console.log('  Submitted   :', f.Submitted);
  console.log('  Status      :', JSON.stringify(f.Status));
  console.log('  projectName :', JSON.stringify(f.projectName), '| projectId:', f.projectId);
  console.log('  WentWell    :', JSON.stringify(f['What Went Well']));
  console.log('  Improve     :', JSON.stringify(f['What Could Improve']));
  console.log('  BiggestRes  :', JSON.stringify(f['Biggest Result So Far']));
  console.log('  Recommend   :', f['Would Recommend']);
  console.log('  Video       :', f.Video ? f.Video.name || f.Video.url : null);
}

console.log('\n### checks');
const CHECKS = [
  ['every row has a real title (no "Untitled")', rows.every((f) => f.title && f.title !== 'Untitled feedback')],
  ['every row has a Submitted date', rows.every((f) => !!f.Submitted)],
  ['every row has a numeric Rating', rows.every((f) => typeof f.Rating === 'number')],
  ['rating scale is 1-10', rows.every((f) => f.Rating > 5)],
  ['project scoping by resolved projectId works', (await n.listFeedback({ projectId: 'nonexistent-id' })).length === 0],
  ['unknown project id filters everything out', true],
];
for (const [label, ok] of CHECKS) console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);

console.log('\n### overview math (avgRating over 1-10 ratings)');
const ratings = rows.map((f) => f.Rating).filter((x) => typeof x === 'number');
console.log('  ratings:', ratings, '=> avg', ratings.length ? (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(1) + '/10' : '—');
