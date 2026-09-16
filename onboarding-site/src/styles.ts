// src/styles.ts — global styles (LaunchOps dark bg, fonts, focus rings).
import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root { min-height: 100%; }

  body {
    font-family: ${theme.fonts.body};
    background:
      linear-gradient(${theme.colors.grid} 1px, transparent 1px),
      linear-gradient(90deg, ${theme.colors.grid} 1px, transparent 1px),
      radial-gradient(1200px 600px at 70% -10%, rgba(76, 201, 240, 0.06), transparent 55%),
      radial-gradient(1000px 700px at -10% 110%, rgba(255, 180, 58, 0.05), transparent 55%),
      ${theme.colors.bg};
    background-size: 44px 44px, 44px 44px, auto, auto, auto;
    color: ${theme.colors.text};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; }
  h1, h2, h3 { font-family: ${theme.fonts.display}; }

  ::selection { background: rgba(255, 180, 58, 0.28); color: #fff; }

  :focus-visible {
    outline: 2px solid ${theme.colors.accent};
    outline-offset: 2px;
  }

  ::-webkit-scrollbar { width: 10px; height: 10px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: #26334d; border-radius: 8px; }
  ::-webkit-scrollbar-thumb:hover { background: #33436a; }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
      scroll-behavior: auto !important;
    }
  }
`;

export default GlobalStyles;