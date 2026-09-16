// src/lib/api.ts
// Client-side API helpers for the onboarding flow.

import type { OnboardPayload, OnboardResponse } from '../types';

export async function submitOnboard(
  payload: OnboardPayload,
): Promise<OnboardResponse> {
  const res = await fetch('/api/onboard', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const data: OnboardResponse = await res.json();
  return data;
}