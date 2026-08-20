// src/api/client.ts — fetch wrappers over the backend API (base '/api', spec §4.8).
// Every non-2xx response must surface as a thrown ApiError with the server's
// JSON { error } message — no silent failures (spec §5.2.5).
import type { CalendarBooking, Health, KpiData, NormalizedEvent, Timeframe, TopLead, TrendBucket } from '../types/events';
import type { AddUserInput, DashboardUser } from '../types/users';

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, init);
  const text = await res.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }
  if (!res.ok) {
    const msg =
      body && typeof body === 'object' && 'error' in body
        ? String((body as { error: unknown }).error)
        : `Request failed (${res.status})`;
    throw new ApiError(msg, res.status);
  }
  return body as T;
}

export const api = {
  health: (signal?: AbortSignal) => request<Health>('/api/health', { signal }),

  kpis: (timeframe: Timeframe, signal?: AbortSignal) =>
    request<KpiData>(`/api/kpis?timeframe=${timeframe}`, { signal }),

  events: (params: { eventType?: string; timeframe?: Timeframe; clientId?: string }, signal?: AbortSignal) => {
    const q = new URLSearchParams();
    if (params.eventType) q.set('eventType', params.eventType);
    if (params.timeframe) q.set('timeframe', params.timeframe);
    if (params.clientId) q.set('clientId', params.clientId);
    const s = q.toString();
    return request<NormalizedEvent[]>(`/api/events${s ? `?${s}` : ''}`, { signal });
  },

  trend: (timeframe: Timeframe, signal?: AbortSignal) =>
    request<{ timeframe: string; buckets: TrendBucket[] }>(`/api/trend?timeframe=${timeframe}`, { signal }),

  topLeads: (timeframe: Timeframe, limit = 5, signal?: AbortSignal) =>
    request<{ timeframe: string; leads: TopLead[] }>(`/api/top-leads?timeframe=${timeframe}&limit=${limit}`, { signal }),

  calendar: (month: string, signal?: AbortSignal) =>
    request<{ month: string; bookings: CalendarBooking[] }>(`/api/calendar?month=${month}`, { signal }),

  users: {
    list: (signal?: AbortSignal) => request<DashboardUser[]>('/api/users', { signal }),
    add: (input: AddUserInput) =>
      request<{ user: DashboardUser }>('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(input),
      }),
  },
};
