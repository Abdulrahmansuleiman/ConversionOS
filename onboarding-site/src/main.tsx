// src/main.tsx
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './styles.css';
import App from './App';
import AfterBookingScreen from './screens/AfterBookingScreen';

const path = window.location.pathname.replace(/\/+$/, '') || '/';

// Standalone post-booking page: /after-booking (or /processing as an alias).
// Everything else runs the normal onboarding funnel.
const root = createRoot(document.getElementById('root')!);

if (path === '/after-booking' || path === '/processing') {
  root.render(
    <StrictMode>
      <AfterBookingScreen />
    </StrictMode>,
  );
} else {
  root.render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}