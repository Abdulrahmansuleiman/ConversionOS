// src/hooks/useUsers.ts — GET/POST /api/users (Settings → Add people, §4.10).
import { useCallback, useState } from 'react';
import { api, ApiError } from '../api/client';
import type { AddUserInput, DashboardUser } from '../types/users';
import { useFetch } from './useFetch';

export function useUsers() {
  const list = useFetch<DashboardUser[]>((signal) => api.users.list(signal), []);
  const [adding, setAdding] = useState(false);

  const addUser = useCallback(
    async (input: AddUserInput): Promise<void> => {
      setAdding(true);
      try {
        await api.users.add(input);
        list.retry(); // re-fetch the list so the new person appears
      } finally {
        setAdding(false);
      }
    },
    [list.retry],
  );

  // Re-export ApiError so the form can distinguish 409 duplicate-email messages.
  const isDuplicate = (err: unknown): boolean => err instanceof ApiError && err.status === 409;

  return { ...list, adding, addUser, isDuplicate };
}
