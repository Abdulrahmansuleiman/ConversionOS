// src/lib/api.ts
// Client-side API helpers for the onboarding flow.

import type { OnboardPayload, OnboardResponse } from '../types';

export async function submitOnboard(
  payload: OnboardPayload,
): Promise<OnboardResponse> {
  let res: Response;
  try {
    res = await fetch('/api/onboard', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      // Fail loud with a clear error instead of spinning forever.
      signal: AbortSignal.timeout(25000),
    });
  } catch (e) {
    if (e instanceof DOMException && e.name === 'TimeoutError') {
      throw new Error(
        'Submission timed out — our system is slow to respond right now. Please try again in a moment.',
      );
    }
    throw e;
  }
  const data: OnboardResponse = await res.json();
  return data;
}