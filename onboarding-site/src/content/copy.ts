// src/content/copy.ts — every visible string on the site, in one place.
// Two hero strings are placeholder drafts awaiting Raymon's approval
// (see BUILD_SPEC §8.3.2) — flagged inline below.

export const copy = {
  landing: {
    eyebrow: 'New client onboarding',
    // PLACEHOLDER — Raymon to approve or replace.
    headline: 'Meet your AI agent, faster.',
    // PLACEHOLDER — Raymon to approve or replace.
    subcopy:
      'Most teams lose leads in the follow-up. LaunchOps builds your conversational AI agent and ships it with a roadmap, a dashboard, and a team that answers. Onboarding takes 5 minutes.',
    whatYouGetTitle: "What you'll get today",
    whatYouGet: [
      '📋 Your personal Notion project workspace (roadmap)',
      '🔑 Dashboard access for your build',
      '📞 Onboarding call with the team',
    ],
    cta: 'Start onboarding →',
    footer: 'Secured by LaunchOps · All data encrypted',
  },

  wizard: {
    steps: ['Contact', 'Company', 'Project', 'Review'],
    back: 'Back',
    next: 'Next',
    edit: 'Edit',
    submit: 'Submit onboarding',
    submitting: 'Submitting…',
    fields: {
      fullName: { label: 'Full name', placeholder: 'Jane Doe' },
      email: { label: 'Email', placeholder: 'jane@company.com' },
      phone: { label: 'Phone', placeholder: '+1 (555) 123-4567' },
      company: { label: 'Company name', placeholder: 'Company, Inc.' },
      website: { label: 'Website', placeholder: 'https://company.com' },
      industry: { label: 'Industry', placeholder: 'Select an industry' },
      teamSize: { label: 'Team size', placeholder: 'Select team size' },
      agentType: { label: 'What should we build? (agent type)', placeholder: 'Select an agent type' },
      mainGoal: { label: 'Main goal', placeholder: 'What should this agent accomplish for you?' },
      currentProcess: { label: 'Current process', placeholder: 'How do you handle these conversations today?' },
      anythingElse: { label: 'Anything else we should know?', placeholder: 'Anything else… (optional)' },
    },
    completionTitle: "You're in. Your project is queued.",
    completionBody: [
      'Your Notion workspace and roadmap are being prepared.',
      'The team will reach out to book your onboarding call.',
      'Your build dashboard goes live as soon as we kick off.',
    ],
    viewStatus: 'View your onboarding status →',
    backHome: 'Back to home',
  },

  status: {
    journey: 'Your onboarding journey',
    whatYouGetNext: "What you'll get next",
    nextItems: ['Onboarding call with the team', 'Your build dashboard goes live'],
    notFoundTitle: "We couldn't find an onboarding for this link.",
    startOnboarding: 'Start onboarding →',
  },
} as const;