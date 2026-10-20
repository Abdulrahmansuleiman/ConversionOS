// src/lib/status.ts
// Client-side mirror of server/status.js. The portal must never disagree with
// the API about whether a stage is done — a stage marked "completed" by hand or
// by another tool still counts, so we never show "4/6 stages" on a finished
// project.
export const COMPLETE_VALUES = new Set(['complete', 'completed', 'done', 'finished']);

export function isCompleteMilestone(status?: string | null): boolean {
  return COMPLETE_VALUES.has(String(status ?? '').trim().toLowerCase());
}

export function countComplete(milestones: { Status?: string | null }[]): number {
  return (milestones || []).filter((m) => isCompleteMilestone(m.Status)).length;
}

// Every stage done = project finished (same hard invariant as the server).
export function allMilestonesComplete(milestones: { Status?: string | null }[]): boolean {
  return (milestones?.length ?? 0) > 0 && countComplete(milestones) === milestones.length;
}
