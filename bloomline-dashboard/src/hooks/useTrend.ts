// src/hooks/useTrend.ts — GET /api/trend?timeframe= (weekly booking trend chart)
import { api } from '../api/client';
import type { Timeframe, TrendBucket } from '../types/events';
import { useFetch } from './useFetch';

export function useTrend(timeframe: Timeframe) {
  return useFetch<{ timeframe: string; buckets: TrendBucket[] }>(
    (signal) => api.trend(timeframe, signal),
    [timeframe],
  );
}
