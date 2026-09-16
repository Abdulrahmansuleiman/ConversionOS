// server/onboarding.js
// Onboarding orchestration for the client-facing site:
//   - slugify / latest-project-by-slug lookup (status page)
//   - server-side field validation (never trusts the client)
//   - createProjectWithRoadmap with §5.4 compensation on partial failure
import * as n from './notion.js';
import { DB } from './schemas.js';

// Canonical phases — same values as the portal's PHASES constant
// (launchops-portal/src/theme.ts); inlined here as plain JS because the
// server runs without a TS build step (portal precedent: routes.js PHASE_ORDER).
export const PHASES = ['Kickoff', 'Design', 'Build', 'Review', 'Launch', 'Post-launch support'];

// Form option lists — MUST match src/content/options.ts (identical values).
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
];

export const TEAM_SIZES = ['1', '2–5', '6–10', '11–25', '26–50', '50+'];

export const AGENT_TYPES = [
  'AI Intro Message Agent',
  'AI Conversation Agent',
  'AI Follow Up Agent',
  'Full ConversionOS',
];

export const STATUS_IN_DISCOVERY = 'In Discovery';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// --- Slug derivation (§5.3) ---
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

// --- Validation (every field re-validated server-side, §5.2) ---
export function validateOnboardPayload(body = {}) {
  const fields = {};
  const fail = (field, reason) => {
    fields[field] = reason;
  };

  const fullName = String(body.fullName ?? '').trim();
  if (fullName.length < 2 || fullName.length > 120) {
    fail('fullName', 'Full name must be 2–120 characters.');
  }

  const email = String(body.email ?? '').trim();
  if (!EMAIL_RE.test(email)) {
    fail('email', 'Enter a valid email address.');
  }

  const phoneDigits = String(body.phone ?? '').replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    fail('phone', 'Phone number must contain 7–15 digits.');
  }

  const company = String(body.company ?? '').trim();
  if (company && (company.length < 2 || company.length > 120)) {
    fail('company', 'Company name must be 2–120 characters.');
  }

  const website = String(body.website ?? '').trim();
  if (website) {
    let parsed;
    try {
      parsed = new URL(website);
    } catch {
      parsed = null;
    }
    if (!parsed || (parsed.protocol !== 'http:' && parsed.protocol !== 'https:')) {
      fail('website', 'Website must be a valid http(s) URL.');
    }
  }

  const industry = String(body.industry ?? '').trim();
  if (!INDUSTRIES.includes(industry)) {
    fail('industry', 'Select an industry from the list.');
  }

  const teamSize = String(body.teamSize ?? '').trim();
  if (!TEAM_SIZES.includes(teamSize)) {
    fail('teamSize', 'Select a team size from the list.');
  }

  const agentType = String(body.agentType ?? '').trim();
  if (!AGENT_TYPES.includes(agentType)) {
    fail('agentType', 'Select an agent type from the list.');
  }

  const mainGoal = String(body.mainGoal ?? '').trim();
  if (mainGoal.length < 10 || mainGoal.length > 2000) {
    fail('mainGoal', 'Main goal must be 10–2000 characters.');
  }

  const currentProcess = String(body.currentProcess ?? '').trim();
  if (currentProcess.length < 10 || currentProcess.length > 2000) {
    fail('currentProcess', 'Current process must be 10–2000 characters.');
  }

  const anythingElse = String(body.anythingElse ?? '').trim();
  if (anythingElse.length > 2000) {
    fail('anythingElse', 'Anything else must be at most 2000 characters.');
  }

  const keys = Object.keys(fields);
  if (keys.length) {
    const first = keys[0];
    return { error: fields[first], fields };
  }
  return { error: null, fields: null };
}

// --- Compensation helper (§5.4): rows cannot be deleted via API, only archived ---
async function archivePage(pageId) {
  await fetch(`https://api.notion.com/v1/pages/${pageId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${n.token()}`,
      'Notion-Version': '2025-09-03',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ archived: true }),
  });
}

// --- Orchestration: project row + 6 roadmap milestones (§5.2, §5.4) ---
// On success returns { projectId, clientSlug, clientName }.
// On project-create failure throws the raw Notion error.
// On partial roadmap failure archives what succeeded and throws an error
// carrying `partialProjectId` so the operator can verify cleanup.
export async function createProjectWithRoadmap(body) {
  const fullName = String(body.fullName ?? '').trim();
  const company = String(body.company ?? '').trim();

  const clientName = company || fullName;
  const notesBase = `[Onboarded via onboarding site] Goal: ${String(body.mainGoal ?? '').trim()} | Current process: ${String(body.currentProcess ?? '').trim()}`;
  const anythingElse = String(body.anythingElse ?? '').trim();
  const notes = anythingElse ? `${notesBase} | Other: ${anythingElse}` : notesBase;

  const projectId = await n.createRow(
    'Projects',
    {
      Client: clientName,
      Status: STATUS_IN_DISCOVERY,
      Industry: String(body.industry ?? '').trim(),
      'AI Persona': String(body.agentType ?? '').trim(),
      Notes: notes,
    },
    DB.Projects.props
  );

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

  return { projectId, clientSlug, clientName };
}

// --- Latest project lookup (§5.5) ---
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