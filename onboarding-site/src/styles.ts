// src/styles.ts — global styles (LaunchOps dark bg, fonts, focus rings).
import { createGlobalStyle } from 'styled-components';
import { theme } from './theme';

export const GlobalStyles = createGlobalStyle`
  * { box-sizing: border-box; margin: 0; padding: 0; }

  html, body, #root { min-height: 100%; }

  body {
    font-family: ${theme.fonts.body};
    background:
      radial-gradient(1100px 560px at 50% -8%, rgba(37, 99, 235, 0.1), transparent 60%),
      ${theme.colors.bg};
    color: ${theme.colors.text};
    -webkit-font-smoothing: antialiased;
    text-rendering: optimizeLegibility;
  }

  a { color: inherit; text-decoration: none; }
  button { font-family: inherit; cursor: pointer; }
  h1, h2, h3 { font-family: ${theme.fonts.display}; }

  ::selection { background: rgba(37, 99, 235, 0.35); color: #fff; }

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