// src/types/changes.ts — trend-change shape shared by KPI cards (spec §4.7).
export type ChangeLabel = 'up' | 'down' | 'new' | 'neutral';

export interface Change {
  pct: number;
  label: ChangeLabel;
}
