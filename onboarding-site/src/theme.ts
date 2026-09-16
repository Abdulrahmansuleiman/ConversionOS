// LaunchOps brand tokens — LaunchOps BLUE (rebrand per Raymon 2026-09-16).
// Accent palette matches pipeline-dashboard/src/theme.ts (canonical):
//   accent #2563eb (blue-600), hover #1d4ed8, soft rgba(37,99,235,.12),
//   gradient #60a5fa -> #2563eb. Page bg stays LaunchOps deep navy-ink #0A0E17.
export const theme = {
  fonts: {
    display: "'Space Grotesk', 'Inter', system-ui, sans-serif",
    body: "'Inter', system-ui, -apple-system, sans-serif",
    mono: "'JetBrains Mono', 'SFMono-Regular', monospace",
  },
  colors: {
    bg: '#0A0E17',
    surface: '#111A2B',
    surface2: '#0D1522',
    border: '#243047',
    borderSoft: '#1B2740',
    text: '#EAF1F9',
    textMuted: '#8B96AC',
    textFaint: '#5B6787',
    // brand accent (blue-600 family)
    accent: '#2563eb',
    accentHover: '#1d4ed8',
    accentSoft: 'rgba(37, 99, 235, 0.12)',
    accentGradient: 'linear-gradient(135deg, #60a5fa 0%, #2563eb 100%)',
    accent2: '#60a5fa',
    accent2Soft: 'rgba(96, 165, 250, 0.12)',
    // icon tints (muted blue family for the landing list rows)
    iconDoc: '#93c5fd',
    iconPhone: '#60a5fa',
    positive: '#34D399',
    negative: '#F87171',
    warning: '#FBBF24',
    info: '#60a5fa',
    sidebarBg: '#080B12',
    sidebarText: '#8B96AC',
    sidebarActive: '#2563eb',
    // subtle fine-grid line for the landing page backdrop
    gridLine: 'rgba(139, 150, 172, 0.05)',
  },
  gridSize: '42px',
  radii: { sm: 8, md: 12, lg: 18 },
  shadows: {
    card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px rgba(0,0,0,0.35)',
    hover: '0 1px 0 rgba(255,255,255,0.05) inset, 0 18px 44px rgba(0,0,0,0.5), 0 0 0 1px rgba(37,99,235,0.18)',
    glow: '0 0 0 1px rgba(37,99,235,0.35), 0 0 24px rgba(37,99,235,0.18)',
  },
};

export type StatusColor = string;

export const projectStatusColor: Record<string, string> = {
  'In Discovery': '#8B96AC',
  Proposed: '#60a5fa',
  Contracted: '#2563eb',
  Building: '#C084FC',
  QA: '#22D3EE',
  Live: '#34D399',
  Completed: '#6EE7B7',
};

export const phaseStatusColor: Record<string, string> = {
  'Not started': '#5B6787',
  'In progress': '#2563eb',
  Blocked: '#F87171',
  Complete: '#34D399',
};

export const PHASES = ['Kickoff', 'Design', 'Build', 'Review', 'Launch', 'Post-launch support'] as const;

export const ASSET_TYPES = ['AI Persona Prompt', 'Build Spec', 'n8n Workflow', 'Dashboard', 'Contract', 'Invoice', 'Proposal', 'Receipt'] as const;

export const PROJECT_STATUSES = ['In Discovery', 'Proposed', 'Contracted', 'Building', 'QA', 'Live', 'Completed'] as const;