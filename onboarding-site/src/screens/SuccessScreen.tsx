// src/screens/SuccessScreen.tsx
// Screen 5 — Success. No stepper. Green check banner, step cards, Cal.com placeholder.

interface Props {
  firstName: string;
}

export default function SuccessScreen({ firstName }: Props) {
  return (
    <div className="card">
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

      {/* Step 1 — Notion workspace */}
      <div className="step-card">
        <div className="step-card-title">Step 1 — Open your project workspace</div>
        <div className="step-card-desc">
          Your Notion workspace includes a task board, deliverables list, and full project
          roadmap.
        </div>
        <a
          className="step-card-btn"
          href="https://www.notion.so"
          target="_blank"
          rel="noopener noreferrer"
        >
          Open in Notion <span aria-hidden="true">↗</span>
        </a>
      </div>

      {/* Step 2 — Kickoff call */}
      <div>
        <p className="personalized">
          <strong>{firstName},</strong> one last thing.
        </p>
        <h3 className="h2" style={{ fontSize: 20, marginTop: 4 }}>
          Step 2 — Book your kickoff call.
        </h3>
      </div>

      <div className="booking-placeholder">
        Booking widget — connect Cal.com or Calendly here
      </div>
    </div>
  );
}