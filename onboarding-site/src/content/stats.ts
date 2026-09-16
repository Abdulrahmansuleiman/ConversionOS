// src/content/stats.ts — landing stat cards.
// Values are placeholders awaiting Raymon (BUILD_SPEC §6.2): value === null
// renders "—" on the page. Nothing is guessed here; RJ Media's figures
// (50+, 7 days, 3x) must never appear anywhere in src/.
export type Stat = { label: string; value: number | null; unit?: string; confirmed: boolean };

export const stats: Stat[] = [
  { label: 'Businesses scaled', value: null, confirmed: false }, // PLACEHOLDER — Raymon to confirm
  { label: 'Days to go live', value: null, confirmed: false },
  { label: 'Average ROI', value: null, unit: 'x', confirmed: false },
];