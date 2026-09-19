// src/screens/SuccessScreen.tsx
// Screen 5 — Success. No stepper. Success banner, Notion roadmap access card,
// GoHighLevel booking widget (LeadConnector embed).

import { useEffect } from 'react';

interface Props {
  firstName: string;
}

const BOOKING_SRC = 'https://api.leadconnectorhq.com/widget/booking/n6A0JupbZJCV5l50rewr';
const WIDGET_ID = 'DEU4doKcUr2mk0JlOCvF_1789585815658';

// Where access requests are sent. THIS is the inbox the client's pre-written
// "Request access in Notion" mail lands in.
const ACCESS_REQUEST_TO = 'abdul123rahmanj@gmail.com';

export default function SuccessScreen({ firstName }: Props) {
  // Capitalize the first letter of the first name (display-only).
  const prettyName = firstName
    ? firstName.charAt(0).toUpperCase() + firstName.slice(1)
    : 'There';

  // Pre-composed email: opens the client's mail app with everything filled in,
  // so all they do is press Send.
  const accessMailto = `mailto:${ACCESS_REQUEST_TO}?subject=${encodeURIComponent(
    `Notion access request — ${prettyName}'s onboarding`,
  )}&body=${encodeURIComponent(
    `Hi LaunchOps team,\n\n` +
      `I've just booked my onboarding/kickoff call and would like access to my project workspace in Notion.\n\n` +
      `Could you please send me the invite?\n\n` +
      `Thanks,\n${prettyName}`,
  )}`;

  // Load the LeadConnector form_embed script once so the widget hydrates.
  useEffect(() => {
    if (document.getElementById('msgsndr-form-embed')) return;
    const script = document.createElement('script');
    script.id = 'msgsndr-form-embed';
    script.src = 'https://link.msgsndr.com/js/form_embed.js';
    script.async = true;
    document.body.appendChild(script);
    return () => {
      // Keep the script cached — removing it would break the widget on re-mount.
    };
  }, []);

  return (
    <div className="card card--wide">
      {/* Success banner */}
      <div className="success-banner">
        <span className="success-banner-icon" aria-hidden="true">✅</span>
        <div>
          <div className="success-banner-text">Project set up successfully</div>
          <div className="success-banner-sub">
            Your Notion roadmap has been created and your account is in progress. Your roadmap
            link is below — request access and we&apos;ll approve you within minutes.
          </div>
        </div>
      </div>

      {/* Step 1 — Notion roadmap access request */}
      <div className="step-card">
        <div className="step-card-title">📋 Step 1 — Open your project roadmap</div>
        <div className="step-card-sub">Your personal Notion workspace is live</div>
        <div className="step-card-text">
          We&apos;ve built your dedicated project space in Notion. It contains your task board,
          deliverables and every meeting recording.
        </div>
        <div className="step-card-text">
          <span className="step-card-label">How to get access.</span>{' '}
          Click the button below to <span className="step-card-ref">"Request access"</span> — it
          opens a ready-made email to us. Send it and we&apos;ll approve you within minutes.
        </div>
        <div className="access-row">
          <a className="primary-btn primary-btn--fit" href={accessMailto}>
            Request access in Notion <span aria-hidden="true">→</span>
          </a>
          <span className="access-row-hint">Then come back and book your call below 👇</span>
        </div>
      </div>

      {/* Step 2 — Kickoff call */}
      <div>
        <p className="personalized">
          <strong>{prettyName},</strong> <span className="white-text">one last thing.</span>
        </p>
        <p className="personalized">
          Step 2: Book your onboarding call. We will open your Notion roadmap together and kick
          things off.
        </p>
      </div>

      <iframe
        src={BOOKING_SRC}
        allow="payment"
        id={WIDGET_ID}
        className="booking-widget"
        scrolling="no"
        title="Book your kickoff call"
      />
    </div>
  );
}