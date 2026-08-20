// src/hooks/useTopLeads.ts — GET /api/top-leads?timeframe=&limit=
import { api } from '../api/client';
import type { Timeframe, TopLead } from '../types/events';
import { useFetch } from './useFetch';

export function useTopLeads(timeframe: Timeframe, limit = 5) {
  return useFetch<{ timeframe: string; leads: TopLead[] }>(
    (signal) => api.topLeads(timeframe, limit, signal),
    [timeframe, limit],
  );
}
