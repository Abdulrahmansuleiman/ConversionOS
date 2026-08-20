// src/hooks/useCalendar.ts — GET /api/calendar?month=YYYY-MM
import { api } from '../api/client';
import type { CalendarBooking } from '../types/events';
import { useFetch } from './useFetch';

export function useCalendar(month: string) {
  return useFetch<{ month: string; bookings: CalendarBooking[] }>((signal) => api.calendar(month, signal), [month]);
}
