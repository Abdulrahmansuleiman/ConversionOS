// src/content/options.ts
// Canonical option lists for the onboarding flow.
// MUST match server/onboarding.js (identical values) — the server re-validates
// every selectable against these exact strings.

export const AGENT_TYPES = [
  'Text AI Agent',
  'Voice AI Agent',
  'ReactivationOS Agent',
  'OnboardingOS',
] as const;

export type AgentType = (typeof AGENT_TYPES)[number];

export const AGENT_ROWS: { type: AgentType; description: string }[] = [
  {
    type: 'Text AI Agent',
    description: 'Instant AI text follow-up on every inbound lead, so nothing goes cold.',
  },
  {
    type: 'Voice AI Agent',
    description: 'AI-handled inbound and outbound calls for your business.',
  },
  {
    type: 'ReactivationOS Agent',
    description: 'Re-engages dormant leads and past contacts automatically.',
  },
  {
    type: 'OnboardingOS',
    description: 'Automates onboarding for your own customers, end to end.',
  },
];

export const HEARD_ABOUT = [
  'YouTube',
  'Instagram',
  'TikTok',
  'Facebook',
  'LinkedIn',
  'Referral',
  'Cold outreach',
  'Google',
  'Newsletter',
  'Partner',
  'Other',
] as const;

export const INDUSTRIES = [
  'Solar / Renewables',
  'Heat pumps / Boilers',
  'Property / Real Estate',
  'Construction / Trades',
  'Healthcare / Clinics',
  'Gym / Fitness',
  'Recruitment',
  'Financial Services',
  'Legal',
  'E-commerce',
  'SaaS',
  'Other',
] as const;

export const REVENUE_RANGES = [
  'Under £5k',
  '£5k–15k',
  '£15k–30k',
  '£30k–75k',
  '£75k–150k',
  '£150k+',
  'Prefer not to say',
] as const;

export const TEAM_SIZES = ['Just me', '2–5', '6–15', '16–50', '50+'] as const;

export const YEARS_IN_BUSINESS = ['Under 1', '1–2', '3–5', '5–10', '10+'] as const;

// Discovery questions in canonical order — labels match server/onboarding.js.
export interface DiscoveryQuestion {
  key: DiscoveryKey;
  label: string;
  placeholder: string;
  /** Rendered full-width (outside the two-column stakes grid). */
  fullWidth?: boolean;
}

export const DISCOVERY_KEYS = [
  'whyLaunchOps',
  'painPoint',
  'triedBefore',
  'almostStopped',
  'consideredOthers',
  'actionTrigger',
  'problemOwnWords',
  'costOfNotSolving',
  'success90Days',
  'businessChange',
] as const;

export type DiscoveryKey = (typeof DISCOVERY_KEYS)[number];

export const DISCOVERY_QUESTIONS: DiscoveryQuestion[] = [
  {
    key: 'whyLaunchOps',
    label: 'Why did you decide to work with LaunchOps?',
    placeholder: 'what outcome were you after',
  },
  {
    key: 'painPoint',
    label: 'What was your #1 pain point before reaching out?',
    placeholder: 'in your own words',
  },
  {
    key: 'triedBefore',
    label: 'What had you already tried before finding us?',
    placeholder: 'other tools, hires, DIY attempts',
  },
  {
    key: 'almostStopped',
    label: 'What almost stopped you from investing?',
    placeholder: 'be honest — price, doubt, timing',
  },
  {
    key: 'consideredOthers',
    label: 'Who else did you consider? / What tipped it in our favor?',
    placeholder: 'who else was in the running — and what made you pick us',
  },
  {
    key: 'actionTrigger',
    label: 'What specific thing pushed you to take action?',
    placeholder: 'a post, a call, a demo — link it if you can',
  },
  {
    key: 'problemOwnWords',
    label: 'How would you describe your problem in your own words?',
    placeholder: 'not how you think we\'d phrase it',
  },
  {
    key: 'costOfNotSolving',
    label: "What's the cost of not solving this?",
    placeholder: 'what it keeps costing you — time, money, missed deals',
  },
  {
    key: 'success90Days',
    label: 'What does success look like in 90 days?',
    placeholder: 'paint the picture of where you want to be',
  },
  {
    key: 'businessChange',
    label: 'How would your business change if this works perfectly?',
    placeholder: 'what changes day to day',
    fullWidth: true,
  },
];