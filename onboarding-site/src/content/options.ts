// src/content/options.ts — wizard select options (steps 2 & 3).
// MUST match server/onboarding.js INDUSTRIES / TEAM_SIZES / AGENT_TYPES
// (identical values — the server re-validates against them).
export const INDUSTRIES = [
  'Software / SaaS',
  'E-commerce',
  'Healthcare',
  'Real Estate',
  'Legal',
  'Financial Services',
  'Education',
  'Home Services',
  'Automotive',
  'Fitness & Health',
  'Marketing & Advertising',
  'Travel & Hospitality',
  'Professional Services',
  'Manufacturing',
  'Other',
] as const;

export const TEAM_SIZES = ['1', '2–5', '6–10', '11–25', '26–50', '50+'] as const;

export const AGENT_TYPES = [
  'AI Intro Message Agent',
  'AI Conversation Agent',
  'AI Follow Up Agent',
  'Full ConversionOS',
] as const;