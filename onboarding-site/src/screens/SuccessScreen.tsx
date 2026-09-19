// src/screens/SuccessScreen.tsx
// Screen 5 — Success. No stepper. Green check banner, step cards,
// GoHighLevel booking widget (LeadConnector embed).

import { useEffect } from 'react';

interface Props {
  firstName: string;
}

const BOOKING_SRC = 'https://api.leadconnectorhq.com/widget/booking/n6A0JupbZJCV5l50rewr';
const WIDGET_ID = 'DEU4doKcUr2mk0JlOCvF_1789585815658';

// Where access requests are sent. THIS is the inbox the client's pre-written
// "Request access in Notion" mail lands in.
const ACCESS_REQUEST_TO = 'raymon4d.scales@gmail.com';

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
      {/* Green check banner */}
      <div className="success-banner">
        <span className="success-banner-icon" aria-hidden="true">✓</span>
        <div>
          <div className="success-banner-text">Project set up successfully</div>
          <div className="success-banner-sub">
            Your workspace is being provisioned. You&apos;ll get an email when it&apos;s ready.
          </div>
        </div>
      </div>

      {/* Step 1 — Notion workspace access request */}
      <div className="step-card">
        <div className="step-card-title">Step 1 — Get access to your project workspace</div>
        <div className="step-card-desc">
          Your project workspace lives in Notion. Tap below and your email app opens with a
          ready-made access request — just hit send.
        </div>
        <a className="primary-btn" href={accessMailto}>
          Request access in Notion <span aria-hidden="true">→</span>
        </a>
      </div>

      {/* Step 2 — Kickoff call */}
      <div>
        <p className="personalized">
          <strong>{prettyName},</strong> one last thing.
        </p>
        <h3 className="h2" style={{ fontSize: 20, marginTop: 4, fontWeight: 400 }}>
          Step 2 — Book your onboarding/ kickoff call.
        </h3>
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