// src/content/stats.ts — landing stat cards.
// Confirmed by Raymon: Average ROI '2-3x', Time to go live '2-4 weeks'.
// 'Businesses scaled' has NO confirmed number yet — value stays null and
// renders "—" on the page (§6.2). Nothing is guessed here; RJ Media's
// unconfirmed performance claims must never appear in rendered output.
export type Stat = { label: string; value: number | string | null; unit?: string; confirmed: boolean };

export const stats: Stat[] = [
  { label: 'Businesses scaled', value: null, confirmed: false }, // PLACEHOLDER — Raymon to confirm
  { label: 'Time to go live', value: '2-4 weeks', confirmed: true },
  { label: 'Average ROI', value: '2-3x', confirmed: true },
];