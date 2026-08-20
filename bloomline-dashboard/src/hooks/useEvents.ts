// src/hooks/useEvents.ts — GET /api/events?eventType=&timeframe=&clientId=
import { api } from '../api/client';
import type { NormalizedEvent, Timeframe } from '../types/events';
import { useFetch } from './useFetch';

export function useEvents(params: { eventType?: string; timeframe?: Timeframe; clientId?: string } = {}) {
  const { eventType, timeframe, clientId } = params;
  return useFetch<NormalizedEvent[]>(
    (signal) => api.events({ eventType, timeframe, clientId }, signal),
    [eventType ?? null, timeframe ?? null, clientId ?? null],
  );
}
