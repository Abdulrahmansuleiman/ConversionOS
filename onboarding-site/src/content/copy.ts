// src/content/copy.ts — every visible string on the site, in one place.
// Subcopy approved by Raymon; headline is still a placeholder draft awaiting
// his approval (BUILD_SPEC §8.3.2) — flagged inline below.
// whatYouGet rows reference icons by key ('document' | 'key' | 'phone') so this
// stays a pure data file; the landing page maps keys to react-icons components.

export const copy = {
  landing: {
    eyebrow: 'New client onboarding',
    // PLACEHOLDER — Raymon to approve or replace. The trailing word is rendered
    // with the LaunchOps blue gradient fill (see LandingPage Highlight span).
    headline: 'Meet your AI agent, faster.',
    headlineHighlight: 'faster.',
    subcopy:
      "Most businesses are still doing this manually. You're not. Let's get your project live - this takes 5 minutes.",
    whatYouGetTitle: "What you'll get today",
    whatYouGet: [
      { icon: 'document', text: 'Your personal Notion project workspace (roadmap)' },
      { icon: 'key', text: 'Dashboard access for your build' },
      { icon: 'phone', text: 'Onboarding call with the team' },
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