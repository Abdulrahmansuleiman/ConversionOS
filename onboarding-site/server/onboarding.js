// server/onboarding.js
// Onboarding orchestration for the client-facing site:
//   - slugify / latest-project-by-slug lookup (status endpoint)
//   - server-side field validation (never trusts the client)
//   - createProjectWithRoadmap with compensation on partial failure
//     (rows cannot be deleted via API, only archived)
import * as n from './notion.js';
import { DB } from './schemas.js';

// Canonical phases — same values as the portal's PHASES constant
// (launchops-portal/src/theme.ts); inlined here as plain JS because the
// server runs without a TS build step.
export const PHASES = ['Kickoff', 'Design', 'Build', 'Review', 'Launch', 'Post-launch support'];

// AI agent types the client can have bought — exactly the four rows on
// Screen 3 (single-select). MUST match src/content/options.ts.
export const AGENT_TYPES = [
  'Text AI Agent',
  'Voice AI Agent',
  'ReactivationOS Agent',
  'OnboardingOS',
];

// Chip option lists — MUST match src/content/options.ts (identical values).
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
];

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
];

export const REVENUE_RANGES = [
  'Under £5k',
  '£5k–15k',
  '£15k–30k',
  '£30k–75k',
  '£75k–150k',
  '£150k+',
  'Prefer not to say',
];

export const TEAM_SIZES = ['Just me', '2–5', '6–15', '16–50', '50+'];

export const YEARS_IN_BUSINESS = ['Under 1', '1–2', '3–5', '5–10', '10+'];

export const STATUS_IN_DISCOVERY = 'In Discovery';

// Discovery questions in canonical order — labels are used verbatim in the
// Notion Notes field. MUST match src/content/options.ts DISCOVERY_QUESTIONS.
export const DISCOVERY_QUESTIONS = [
  { key: 'whyLaunchOps', label: 'Why did you decide to work with LaunchOps?' },
  { key: 'painPoint', label: 'What was your #1 pain point before reaching out?' },
  { key: 'triedBefore', label: 'What had you already tried before finding us?' },
  { key: 'almostStopped', label: 'What almost stopped you from investing?' },
  { key: 'consideredOthers', label: 'Who else did you consider? / What tipped it in our favor?' },
  { key: 'actionTrigger', label: 'What specific thing pushed you to take action?' },
  { key: 'problemOwnWords', label: 'How would you describe your problem in your own words?' },
  { key: 'costOfNotSolving', label: "What's the cost of not solving this?" },
  { key: 'success90Days', label: 'What does success look like in 90 days?' },
  { key: 'businessChange', label: 'How would your business change if this works perfectly?' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Slug derivation ---
export function slugify(name, fallbackId) {
  const s = String(name ?? '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (s.length) return s;
  // Empty slug → client-<first 8 chars of the new project row id>.
  const shortId = fallbackId ? String(fallbackId).slice(0, 8) : '';
  return `client-${shortId}`;
}

// --- Validation (every field re-validated server-side) ---
const inList = (value, list) => list.includes(String(value ?? '').trim());
const answer = (v) => String(v ?? '').trim();

export function validateOnboardPayload(body = {}) {
  const fields = {};
  const fail = (field, reason) => {
    fields[field] = reason;
  };

  const fullName = String(body.fullName ?? '').trim();
  if (fullName.length < 2 || fullName.length > 120) {
    fail('fullName', 'Full name must be 2–120 characters.');
  }

  const businessName = String(body.businessName ?? '').trim();
  if (businessName && (businessName.length < 2 || businessName.length > 120)) {
    fail('businessName', 'Business name must be 2–120 characters.');
  }

  const email = String(body.email ?? '').trim();
  if (!EMAIL_RE.test(email)) {
    fail('email', 'Enter a valid email address.');
  }

  const phoneDigits = String(body.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    fail('phone', 'Phone number must contain 7–15 digits.');
  }

  const agentType = String(body.agentType ?? '').trim();
  if (!AGENT_TYPES.includes(agentType)) {
    fail('agentType', 'Select the AI agent you signed up for.');
  }

  // Firmographic chip selections.
  if (!inList(body.heardAbout, HEARD_ABOUT)) {
    fail('heardAbout', 'Select where you first heard about us.');
  }
  if (!inList(body.industry, INDUSTRIES)) {
    fail('industry', 'Select an industry from the list.');
  }
  if (!inList(body.revenueRange, REVENUE_RANGES)) {
    fail('revenueRange', 'Select your monthly revenue range.');
  }
  if (!inList(body.teamSize, TEAM_SIZES)) {
    fail('teamSize', 'Select your team size.');
  }
  if (!inList(body.yearsInBusiness, YEARS_IN_BUSINESS)) {
    fail('yearsInBusiness', 'Select your years in business.');
  }

  // Discovery text answers — all required.
  const discovery = body.discovery ?? {};
  for (const q of DISCOVERY_QUESTIONS) {
    const v = answer(discovery[q.key]);
    if (v.length < 2 || v.length > 5000) {
      fail(`discovery.${q.key}`, `${q.label} (2–5000 characters.)`);
    }
  }

  const keys = Object.keys(fields);
  if (keys.length) {
    const first = keys[0];
    return { error: fields[first], fields };
  }
  return { error: null, fields: null };
}

// --- Compensation helper: rows cannot be deleted via API, only archived ---
async function archivePage(pageId) {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${n.token()}`,
      'Notion-Version': '2025-09-03',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ archived: true }),
    signal: AbortSignal.timeout(15000),
  });
}

// --- Notes: [Onboarded via onboarding site] + all discovery answers ---
export function buildNotes(body = {}) {
  const discovery = body.discovery ?? {};
  const lines = ['[Onboarded via onboarding site]'];
  for (const q of DISCOVERY_QUESTIONS) {
    const v = answer(discovery[q.key]);
    if (v) lines.push(`${q.label}\n${v}`);
  }
  return lines.join('\n\n');
}

// --- Orchestration: project row + 6 roadmap milestones ---
// On success returns { projectId, clientSlug, statusUrl, clientName }.
// On project-create failure throws the raw Notion error.
// On partial roadmap failure archives what succeeded and throws an error
// carrying `partialProjectId` so the operator can verify cleanup.
export async function createProjectWithRoadmap(body) {
  const fullName = String(body.fullName ?? '').trim();
  const businessName = String(body.businessName ?? '').trim();

  // Client = business name (or full name if no business name).
  const clientName = businessName || fullName;

  const project = await n.createRowFull(
    'Projects',
    {
      Client: clientName,
      Status: STATUS_IN_DISCOVERY,
      Industry: String(body.industry ?? '').trim(),
      'AI Persona': String(body.agentType ?? '').trim(),
      Notes: buildNotes(body),
    },
    DB.Projects.props
  );
  const projectId = project.id;

  const clientSlug = slugify(clientName, projectId);

  const results = await Promise.allSettled(
    PHASES.map((phase) =>
      n.createRow(
        'Roadmap',
        {
          Milestone: phase,
          Project: [projectId],
          Phase: phase,
          Status: phase === 'Kickoff' ? 'In progress' : 'Not started',
        },
        DB.Roadmap.props
      )
    )
  );

  const failed = results.filter((r) => r.status === 'rejected');
  if (failed.length) {
    // Compensation: archive everything that did get created, incl. the project.
    const created = results
      .filter((r) => r.status === 'fulfilled')
      .map((r) => r.value)
      .filter(Boolean);
    await Promise.allSettled([...created, projectId].map((id) => archivePage(id)));
    const err = new Error(
      `${failed.length} of ${PHASES.length} roadmap milestones failed to create. ` +
        'Created rows (including the project) were archived — see partialProjectId to verify cleanup.'
    );
    err.partialProjectId = projectId;
    throw err;
  }

  return { projectId, clientSlug, statusUrl: project.url, clientName };
}

// --- Latest project lookup (status endpoint) ---
// Raw queryDatabase results carry created_time (normalize() does not map it).
// Returns null when no row slug-matches; otherwise { project, milestones }.
export async function findLatestProjectBySlug(slug) {
  const rows = await n.queryDatabase('Projects');
  const matches = rows
    .map((r) => ({
      id: r.id,
      createdAt: r.created_time ?? null,
      ...n.normalize({ __id: r.id, ...r.properties }, DB.Projects.titleKey),
    }))
    .filter((r) => slugify(r.title, r.id) === slug);

  if (!matches.length) return null;

  matches.sort((a, b) => String(b.createdAt ?? '').localeCompare(String(a.createdAt ?? '')));
  const project = matches[0];

  const milestones = await n.listRows('Roadmap', DB.Roadmap.titleKey, {
    filter: { property: 'Project', relation: { contains: project.id } },
  });

  return { project, milestones: sortByPhase(milestones) };
}

// Sort milestones by canonical PHASES order, then Due Date.
export function sortByPhase(rows) {
  return [...rows].sort(
    (a, b) =>
      PHASES.indexOf(a.Phase ?? '') - PHASES.indexOf(b.Phase ?? '') ||
      String(a['Due Date'] ?? '').localeCompare(String(b['Due Date'] ?? ''))
  );
}