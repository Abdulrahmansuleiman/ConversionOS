// LaunchOps brand tokens — copied verbatim from launchops-portal/src/theme.ts.
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
    accent: '#FFB43A',
    accentSoft: 'rgba(255, 180, 58, 0.14)',
    accent2: '#4CC9F0',
    accent2Soft: 'rgba(76, 201, 240, 0.12)',
    positive: '#34D399',
    negative: '#F87171',
    warning: '#FBBF24',
    info: '#4CC9F0',
    sidebarBg: '#080B12',
    sidebarText: '#8B96AC',
    sidebarActive: '#FFB43A',
    grid: 'rgba(148, 163, 184, 0.07)',
  },
  radii: { sm: 8, md: 12, lg: 18 },
  shadows: {
    card: '0 1px 0 rgba(255,255,255,0.03) inset, 0 10px 30px rgba(0,0,0,0.35)',
    hover: '0 1px 0 rgba(255,255,255,0.05) inset, 0 18px 44px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,180,58,0.18)',
    glow: '0 0 0 1px rgba(255,180,58,0.35), 0 0 24px rgba(255,180,58,0.18)',
  },
};

export type StatusColor = string;

export const projectStatusColor: Record<string, string> = {
  'In Discovery': '#8B96AC',
  Proposed: '#4CC9F0',
  Contracted: '#FFB43A',
  Building: '#C084FC',
  QA: '#22D3EE',
  Live: '#34D399',
  Completed: '#6EE7B7',
};

export const phaseStatusColor: Record<string, string> = {
  'Not started': '#5B6787',
  'In progress': '#FFB43A',
  Blocked: '#F87171',
  Complete: '#34D399',
};

export const PHASES = ['Kickoff', 'Design', 'Build', 'Review', 'Launch', 'Post-launch support'] as const;

export const ASSET_TYPES = ['AI Persona Prompt', 'Build Spec', 'n8n Workflow', 'Dashboard', 'Contract', 'Invoice', 'Proposal', 'Receipt'] as const;

export const PROJECT_STATUSES = ['In Discovery', 'Proposed', 'Contracted', 'Building', 'QA', 'Live', 'Completed'] as const;