// src/theme.ts — ALL colors/typography as tokens (spec §7: one-line rebrand).
//
// Palette (flagged for Raymon — green/white, matched to the reference dashboard):
//   - accent   #16a34a  green-600 ("bloom" — women's activewear, green/white brand)
//   - gradient #34d399 -> #16a34a
//   - sidebar  #0b3b2a -> #051f16  deep green-ink gradient
//   - positive #16a34a  green,   negative #e86a5f  soft red
//   - page bg  #f4f6f5  green-tinted off-white; dark KPI/donut/trend cards for the
//     premium contrast that matches the reference dashboard.
export const theme = {
  colors: {
    // page + surfaces
    bg: '#f4f6f5',
    surface: '#ffffff',
    border: '#e4eae7',
    borderStrong: '#d3ddd8',

    // sidebar
    sidebarGradient: 'linear-gradient(180deg, #0b3b2a 0%, #051f16 100%)',
    sidebarText: '#9db8ac',
    sidebarTextActive: '#ffffff',
    sidebarActiveBg: 'rgba(52, 211, 153, 0.16)',
    sidebarActiveBar: '#34d399',

    // brand accent
    accent: '#16a34a',
    accentHover: '#15803d',
    accentSoft: 'rgba(22, 163, 74, 0.12)',
    accentGradient: 'linear-gradient(135deg, #34d399 0%, #16a34a 100%)',

    // semantic
    positive: '#16a34a',
    negative: '#e86a5f',
    warning: '#f5a524',

    // ink (dark cards)
    ink: '#0c2b20',
    inkElevated: '#123a2c',
    inkBorder: 'rgba(255, 255, 255, 0.08)',
    onDark: '#f2f7f4',
    onDarkMuted: '#9db8ac',

    // text on light
    textPrimary: '#16231d',
    textSecondary: '#5c6b63',
    textMuted: '#8b9a92',

    // charts
    chartGrid: '#eef1ef',
    chartInk: '#e2eee8',
    donutTrack: 'rgba(255, 255, 255, 0.08)',

    // KPI card dots (green-led set)
    kpi: {
      bookings: '#34d399',
      humanTransfers: '#fbbf24',
      totalConversations: '#60a5fa',
      followUps: '#c084fc',
      leadsQualified: '#22c55e',
    },

    // conversation channels (table dots — real channel brand identity)
    channels: {
      instagram: '#e1306c',
      website: '#7c5cff',
      shopify: '#7ab55c',
      email: '#4a8fe7',
      other: '#9aa0a6',
      Unknown: '#9aa0a6',
    },

    // donut slice scale (green/white monochrome, matching the reference chart)
    donutScale: ['#16a34a', '#34d399', '#4ade80', '#059669', '#2dd4bf', '#a3e635', '#6ee7b7'],
  },
  layout: {
    sidebarWidth: '220px',
    contentPaddingSides: '28px',
    contentPaddingVert: '16px',
  },
  radii: {
    card: '14px',
    button: '10px',
    pill: '999px',
  },
  shadows: {
    card: '0 1px 2px rgba(12, 43, 32, 0.05), 0 10px 28px rgba(12, 43, 32, 0.07)',
  },
  fonts: {
    body: "'Inter', system-ui, -apple-system, 'Segoe UI', sans-serif",
  },
} as const;

export type Theme = typeof theme;
