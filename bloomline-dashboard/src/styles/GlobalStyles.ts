// src/styles/GlobalStyles.ts — reset, Inter, body bg, thin scrollbar (skill Step 4).
import { createGlobalStyle } from 'styled-components';

export const GlobalStyles = createGlobalStyle`
  *, *::before, *::after { box-sizing: border-box; }

  html, body, #root { height: 100%; }

  body {
    margin: 0;
    font-family: ${(p) => p.theme.fonts.body};
    background: ${(p) => p.theme.colors.bg};
    color: ${(p) => p.theme.colors.textPrimary};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  /* thin scrollbar */
  ::-webkit-scrollbar { width: 8px; height: 8px; }
  ::-webkit-scrollbar-thumb { background: rgba(111, 104, 120, 0.35); border-radius: 8px; }
  ::-webkit-scrollbar-thumb:hover { background: rgba(111, 104, 120, 0.55); }
  ::-webkit-scrollbar-track { background: transparent; }

  button { font-family: inherit; }
  input, select, textarea { font-family: inherit; }

  :focus-visible {
    outline: 2px solid ${(p) => p.theme.colors.accent};
    outline-offset: 2px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`;
