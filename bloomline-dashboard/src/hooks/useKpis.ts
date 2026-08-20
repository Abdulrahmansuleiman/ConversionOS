// src/hooks/useKpis.ts — GET /api/kpis?timeframe=
import { api } from '../api/client';
import type { KpiData, Timeframe } from '../types/events';
import { useFetch } from './useFetch';

export function useKpis(timeframe: Timeframe) {
  return useFetch<KpiData>((signal) => api.kpis(timeframe, signal), [timeframe]);
}
