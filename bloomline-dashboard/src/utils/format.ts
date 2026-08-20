// src/utils/format.ts — display helpers. All date formatting uses the browser's
// local timezone (windows are server-local per §4.7; stored timestamps are UTC).
import type { EventPayload } from '../types/events';

export function formatDateTime(iso: string): string {
  return `${formatDate(iso)} · ${formatTime(iso)}`;
}

export function formatDate(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(iso));
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat(undefined, { hour: 'numeric', minute: '2-digit' }).format(new Date(iso));
}

/** 'YYYY-MM-DD' (local) -> 'Aug 6' */
export function formatDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' }).format(new Date(y, m - 1, d));
}

/** Date -> 'YYYY-MM' local month key */
export function toMonthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

export function monthLabel(monthKey: string): string {
  const [y, m] = monthKey.split('-').map(Number);
  return new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(y, m - 1, 1));
}

/**
 * Lead display name per spec §5.2.2: use payload.lead_name when present, else
 * the client_id VERBATIM — never synthesized, never a placeholder token.
 */
export function displayName(payload: EventPayload | undefined, clientId: string): string {
  const ln = payload?.lead_name;
  if (typeof ln === 'string' && ln.trim() !== '') return ln.trim();
  return clientId;
}

export function channelLabel(channel: string | undefined | null): string {
  if (typeof channel === 'string' && channel.trim() !== '') return channel.trim();
  return '—';
}
