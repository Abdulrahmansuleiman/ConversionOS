// src/types/events.ts — normalized event + API shapes (spec §4.1–§4.11).
import type { Change } from './changes';

export type EventType =
  | 'booking_made'
  | 'handed_off_to_human'
  | 'follow_up_triggered'
  | 'conversation_started'
  | 'lead_qualified';

export type Timeframe = 'today' | 'this_week' | 'last_week' | 'last_month' | 'last_2_months';

export interface EventPayload {
  [key: string]: unknown;
  lead_name?: string;
  channel?: string;
  status?: string;
  due_at?: string;
  reason?: string;
  assigned_to?: string;
  meta?: { sample?: boolean };
}

// Persisted record shape — exactly { id, event_type, client_id, timestamp, payload } (§4.3).
export interface NormalizedEvent {
  id: number;
  event_type: string;
  client_id: string;
  timestamp: string;
  payload: EventPayload;
}

export interface KpiCounts {
  bookings: number;
  humanTransfers: number;
  totalConversations: number;
  followUps: number;
  leadsQualified: number;
}

export type KpiKey = keyof KpiCounts;

export interface KpiData {
  current: KpiCounts;
  previous: KpiCounts;
  changes: Record<KpiKey, Change>;
}

export interface TrendBucket {
  date: string; // YYYY-MM-DD (server-local day)
  count: number;
}

export interface TopLead {
  client_id: string;
  name: string | null;
  engagement: number;
  last_event_at: string;
}

export interface CalendarBooking {
  event_id: number;
  date_time: string;
  lead_name: string | null;
  client_id: string;
  channel: string | null;
  status: string | null;
}

export interface Health {
  ok: boolean;
  mode: 'local-file' | 'supabase';
}

export type { Change };
