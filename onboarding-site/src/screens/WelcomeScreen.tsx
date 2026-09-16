// src/screens/WelcomeScreen.tsx
// Screen 1 — Welcome. Stats are "10+", "2–4 weeks", "2-3x" (Raymon confirmed).
// Uses react-icons FiFile, FiKey, FiPhone for the "what you'll get" rows.
import { FiFile, FiKey, FiPhone } from 'react-icons/fi';

interface Props {
  onStart: () => void;
}

const FEATURES = [
  { Icon: FiFile, text: 'Your project workspace in Notion (roadmap + tasks)' },
  { Icon: FiKey, text: 'Account access for your build' },
  { Icon: FiPhone, text: 'Onboarding call with the team' },
] as const;

export default function WelcomeScreen({ onStart }: Props) {
  return (
    <div className="card animate-in">
      {/* Pill badge */}
      <div className="animate-in-delay-1">
        <span className="pill-badge">
          <span className="pill-dot" />
          NEW CLIENT ONBOARDING
        </span>
      </div>

      {/* Headline */}
      <h1 className="h1 animate-in-delay-1" style={{ textAlign: 'center' }}>
        Let&apos;s get your{' '}
        <span className="gradient-text">agent live.</span>
      </h1>

      {/* Subtext */}
      <p className="body-text animate-in-delay-2">
        Most businesses are still doing this manually. You're not. Let's get your project live - this takes 5 minutes.
      </p>

      {/* Stat row */}
      <div className="stat-row animate-in-delay-2">
        <div className="stat-box">
          <span className="stat-number">10+</span>
          <span className="stat-label">Businesses scaled</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">2–4 weeks</span>
          <span className="stat-label">Time to go live</span>
        </div>
        <div className="stat-box">
          <span className="stat-number">2–3x</span>
          <span className="stat-label">Average ROI</span>
        </div>
      </div>

      {/* What you'll get today */}
      <div className="animate-in-delay-3">
        <p className="eyebrow" style={{ textAlign: 'center', marginBottom: 12 }}>
          What you&apos;ll get today
        </p>
        <div className="welcome-features">
          {FEATURES.map(({ Icon, text }) => (
            <div className="welcome-feature" key={text}>
              <span className="welcome-feature-icon">
                <Icon />
              </span>
              <span className="welcome-feature-text">{text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <button className="primary-btn animate-in-delay-3" onClick={onStart}>
        Start onboarding <span className="arrow">→</span>
      </button>

      <p className="footer-note">Secured by LaunchOps · All data encrypted</p>
    </div>
  );
}