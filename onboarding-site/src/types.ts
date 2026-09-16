// src/types.ts
// Shared types for the onboarding flow.

import type { AgentType, DiscoveryKey } from './content/options';

// ---- Form state (maps directly to POST /api/onboard payload) ----

export interface DiscoveryAnswers {
  whyLaunchOps: string;
  painPoint: string;
  triedBefore: string;
  almostStopped: string;
  consideredOthers: string;
  actionTrigger: string;
  problemOwnWords: string;
  costOfNotSolving: string;
  success90Days: string;
  businessChange: string;
}

export interface OnboardPayload {
  fullName: string;
  businessName: string;
  email: string;
  phone: string;
  agentType: AgentType | '';
  heardAbout: string;
  industry: string;
  revenueRange: string;
  teamSize: string;
  yearsInBusiness: string;
  discovery: DiscoveryAnswers;
}

export const emptyForm: OnboardPayload = {
  fullName: '',
  businessName: '',
  email: '',
  phone: '',
  agentType: '',
  heardAbout: '',
  industry: '',
  revenueRange: '',
  teamSize: '',
  yearsInBusiness: '',
  discovery: {
    whyLaunchOps: '',
    painPoint: '',
    triedBefore: '',
    almostStopped: '',
    consideredOthers: '',
    actionTrigger: '',
    problemOwnWords: '',
    costOfNotSolving: '',
    success90Days: '',
    businessChange: '',
  },
};

// ---- Screen state machine ----

export type Screen = 1 | 2 | 3 | 4 | 5;

// ---- Server response ----

export interface OnboardResponse {
  ok: boolean;
  projectId?: string;
  clientSlug?: string;
  statusUrl?: string;
  projectName?: string;
  error?: string;
  fields?: Record<string, string>;
}

// ---- Validation ----

export type ValidationErrors = Partial<Record<string, string>>;

// ---- Discovery field helpers ----

export function setDiscovery<K extends DiscoveryKey>(
  prev: OnboardPayload,
  key: K,
  value: string,
): OnboardPayload {
  return {
    ...prev,
    discovery: {
      ...prev.discovery,
      [key]: value,
    },
  };
}

export function getDiscovery(
  form: OnboardPayload,
  key: string,
): string {
  const rec = form.discovery as unknown as Record<string, string>;
  return rec[key] ?? '';
}