// server/status.js
// SINGLE SOURCE OF TRUTH for a project's Status.
//
// WHY THIS EXISTS
// ---------------
// `Projects.Status` and the roadmap milestone statuses are two independent
// fields in Notion. Marking every milestone "Complete" never touched the
// project-level Status select, so a finished project could keep reading
// "In Discovery" forever.
//
// THE CONTRACT (Raymon's rule — this must hold for every client, forever):
//
//   1. ALL stages Complete  ->  "Completed". Always. Every project. No
//      exceptions, whatever the phases happen to be called, whatever is
//      stored on the project row.
//   2. Launch Complete      ->  "Completed". You do NOT have to complete
//      "Post-launch support" first. Shipping = project complete.
//   3. Reaching a stage never leaves the project below what that stage proves
//      (advance-only merge with the stored value), so "In Discovery" + every
//      stage Complete is structurally impossible.
//   4. A project with nothing complete keeps exactly what is stored: discovery
//      stays discovery until work actually starts.
//   5. A custom stored status (something we don't recognise) is respected —
//      except when every stage is complete, where rule 1 wins.
//
//   effective = ladder[ max(storedLevel, floorLevel) ]
//
// Only COMPLETE milestones create a floor. An "In progress" stage proves
// nothing about the project-level status.

export const STATUS_LADDER = ['In Discovery', 'Proposed', 'Contracted', 'Building', 'QA', 'Live', 'Completed'];

export const STATUS_COMPLETED = 'Completed';
export const STATUS_FIRST = STATUS_LADDER[0];

// Minimum Status implied by a COMPLETED milestone of that phase.
// Keys are normalized (lowercase, trimmed, whitespace collapsed, dashes unified).
//
// NOTE: `launch` maps to "Completed", not "Live". The dashboard going live is
// the last thing we deliver; when Launch is Complete the project is done.
// "Live" remains a manual/mid-flight state (e.g. site is up during support).
export const FLOOR_BY_PHASE = {
  kickoff: 'Contracted',
  design: 'Building',
  build: 'Building',
  review: 'QA',
  launch: STATUS_COMPLETED,
  'post-launch support': STATUS_COMPLETED,
  'post launch support': STATUS_COMPLETED,
  support: STATUS_COMPLETED,
};

// Every value a milestone Status select may hold that means "this stage is done".
const COMPLETE_VALUES = new Set(['complete', 'completed', 'done', 'finished']);

// A roadmap that reaches this many stages is a full client lifecycle. Only then
// does "everything on it is complete" mean the project is finished — a project
// with a single (or truncated) roadmap row that happens to be complete still
// only proves the stage it is on.
const MIN_FULL_LIFECYCLE_STAGES = 5;

export function isCompleteMilestone(status) {
  return COMPLETE_VALUES.has(String(status ?? '').trim().toLowerCase());
}

export function normalizePhase(phase) {
  return String(phase ?? '')
    .toLowerCase()
    .replace(/[\u2010-\u2015]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

// Case-insensitive lookup against the ladder, returning the canonical label
// ("completed" -> "Completed"). Returns the trimmed original when the stored
// value is not part of the ladder (custom status).
export function canonicalStatus(status) {
  const raw = String(status ?? '').trim();
  if (!raw) return '';
  const hit = STATUS_LADDER.find((s) => s.toLowerCase() === raw.toLowerCase());
  return hit ?? raw;
}

const level = (status) => STATUS_LADDER.indexOf(status);

/**
 * Derive the effective Status for a project from its milestones.
 * @param {string|null|undefined} storedStatus current Projects.Status value
 * @param {Array<{Status?: string|null, Phase?: string|null}>} milestones
 * @returns {string|null}
 */
export function deriveProjectStatus(storedStatus, milestones) {
  const ms = Array.isArray(milestones) ? milestones : [];
  const stored = canonicalStatus(storedStatus);

  // No roadmap at all -> the stored value is the only truth.
  if (ms.length === 0) return stored || null;

  const completed = ms.filter((m) => isCompleteMilestone(m?.Status));

  // 1. Nothing started -> stored is the truth (new clients stay In Discovery).
  if (completed.length === 0) return stored || null;

  // 2. HARD INVARIANT: a full lifecycle roadmap with every stage complete ->
  //    Completed. Always. This is the rule that can never be broken by a
  //    renamed phase, a new phase, or a stale stored select.
  if (completed.length === ms.length && ms.length >= MIN_FULL_LIFECYCLE_STAGES) {
    return STATUS_COMPLETED;
  }

  // 3. A custom stored status is respected (we do not fight data we don't know).
  const storedLevel = stored ? level(stored) : -1;
  if (stored && storedLevel === -1) return stored;

  // 4. Floor = furthest completed milestone on the ladder.
  let floorLevel = -1;
  for (const m of completed) {
    const floor = FLOOR_BY_PHASE[normalizePhase(m?.Phase)];
    const l = floor ? level(floor) : -1;
    if (l > floorLevel) floorLevel = l;
  }
  if (floorLevel === -1) return stored || null; // unknown phases -> no opinion

  // 5. Advance-only merge: stored can be raised by hand, never undercut.
  return STATUS_LADDER[Math.max(storedLevel, floorLevel)];
}

/**
 * Convenience predicate used by the API layer: does this project's roadmap
 * prove it is finished?
 */
export function isProjectFinished(milestones) {
  const ms = Array.isArray(milestones) ? milestones : [];
  return ms.length > 0 && ms.every((m) => isCompleteMilestone(m?.Status));
}
