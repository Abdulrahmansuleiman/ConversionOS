// src/hooks/useHealth.ts — mode badge source (spec §4.5: { ok, mode }).
import { api } from '../api/client';
import type { Health } from '../types/events';
import { useFetch } from './useFetch';

export function useHealth() {
  return useFetch<Health>((signal) => api.health(signal), []);
}
