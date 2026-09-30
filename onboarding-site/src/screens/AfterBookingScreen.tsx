// src/screens/AfterBookingScreen.tsx
// Post-booking "your onboarding is being processed" page.
//
// This page is the REDIRECT TARGET for the booking calendar. Set the calendar's
// redirect/thank-you URL to something like:
//   https://onboarding.launchopsai.click/after-booking?name=Alex&date=2026-10-02
// Supported query params (calendar merge fields vary by tool):
//   ?name= | ?first_name= | ?invitee_first_name=   → first name
//   ?date= | ?kickoff=                             → "See you on Friday 2 October"
// Falls back to localStorage (saved when the client reached the booking
// screen) for name + agent type, then to graceful generic copy. No invented
// data ever renders — if a param is missing, that piece is just omitted.
//
// VSL (video sales letter): paste the video URL into VSL_URL below. YouTube and
// Vimeo links render as embedded players; a direct .mp4 renders a <video>.
// Leave it '' to show the glowing placeholder frame until the video is ready.

import { useState } from 'react';
import {
  FiCalendar,
  FiPenTool,
  FiTool,
  FiCheckCircle,
  FiSend,
  FiTrendingUp,
  FiPlay,
  FiMail,
  FiEdit3,
  FiMessageCircle,
  FiChevronDown,
} from 'react-icons/fi';

// ── Paste your VSL here ────────────────────────────────────────────────
//   YouTube: https://www.youtube.com/embed/VIDEO_ID
//   Vimeo:   https://player.vimeo.com/video/VIDEO_ID
//   Direct:  https://your-cdn.com/video.mp4
const VSL_URL = '';
// ───────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    Icon: FiCalendar,
    title: 'Kickoff call',
    text: 'We meet, open your roadmap together and lock the plan.',
  },
  {
    Icon: FiPenTool,
    title: 'Design',
    text: "We design your AI agent's workflow, messaging and handoffs.",
  },
  {
    Icon: FiTool,
    title: 'Build',
    text: 'We build and connect your agent to your systems.',
  },
  {
    Icon: FiCheckCircle,
    title: 'Review',
    text: 'You test it live. We refine until it\u2019s right.',
  },
  {
    Icon: FiSend,
    title: 'Launch',
    text: 'Your agent goes live and starts working for you.',
  },
  {
    Icon: FiTrendingUp,
    title: 'Post-launch support',
    text: 'We keep it sharp \u2014 monitoring, updates, growth.',
  },
] as const;

// Grounded in the same real numbers the onboarding funnel shows on screen 1
// ("2–4 weeks to go live", "6-month program", "2–3x average ROI").
const STATS = [
  { number: '2–4 weeks', label: 'To go live' },
  { number: '6 months', label: 'Program duration' },
  { number: '2–3x', label: 'Average ROI' },
] as const;

// "While you wait" — action items grounded in the real flow (the Notion access
// request email, the booking confirmation, the kickoff prep).
const PREP = [
  {
    Icon: FiMail,
    title: 'Check your inbox',
    text: 'Your Notion workspace invite lands within minutes of your access request.',
  },
  {
    Icon: FiEdit3,
    title: 'Note your 3 goals',
    text: 'Jot down what success looks like for you before the kickoff call.',
  },
  {
    Icon: FiMessageCircle,
    title: 'Questions? Just reply',
    text: 'Reply to your onboarding email any time \u2014 a human answers.',
  },
] as const;

// Real questions clients ask; answers come from the actual flow, not invented.
const FAQS = [
  {
    q: 'When do I get my Notion workspace access?',
    a: 'Click "Request access" on your onboarding page \u2014 it opens a ready-made email to us. We approve requests within minutes, and your roadmap link lands straight in your inbox.',
  },
  {
    q: 'How long until I\u2019m live?',
    a: '2\u20134 weeks from kickoff. You\u2019ll follow your roadmap step by step \u2014 design, build, review, launch \u2014 and we stay with you through post-launch support.',
  },
  {
    q: 'What if I need to reschedule the kickoff call?',
    a: 'No problem at all. Use the reschedule link in your calendar invite \u2014 that updates everything automatically on our side too.',
  },
] as const;

function isEmbeddable(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

function pretty(name: string): string {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'there';
}

function formatDate(value: string | null): string | null {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-GB', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function AfterBookingScreen() {
  const params = new URLSearchParams(window.location.search);
  const name =
    params.get('name') ||
    params.get('first_name') ||
    params.get('invitee_first_name') ||
    params.get('firstName') ||
    localStorage.getItem('launchops-first-name') ||
    '';
  const prettyName = pretty(name);
  const agentType = localStorage.getItem('launchops-agent-type') || '';
  const kickoffDay = formatDate(params.get('date') || params.get('kickoff'));
  const video = VSL_URL.trim();
  const [openFaq, setOpenFaq] = useState<number | null>(0);

  return (
    <div className="page ab-page">
      <header className="logo-header">
        <img src="/logo.png" alt="LaunchOps" width={130} />
      </header>

      <div className="ab-hero animate-in">
        <span className="pill-badge ab-badge">
          <span className="pill-dot" />
          ONBOARDING IN PROGRESS
        </span>

        <h1 className="ab-title">
          Hey, <span className="gradient-text">{prettyName}.</span> Your onboarding is being{' '}
          <span className="ab-accent">processed.</span>
        </h1>

        <p className="ab-sub">
          Great decision — and you&apos;re in great hands. Watch the short video below,
          then see exactly what happens next.
        </p>

        {agentType && (
          <div className="ab-build-chip">
            <span className="ab-build-label">You&apos;re set up with</span>
            <span className="ab-build-value">{agentType}</span>
            {kickoffDay && <span className="ab-build-sep">·</span>}
            {kickoffDay && <span className="ab-build-day">Kickoff on {kickoffDay}</span>}
          </div>
        )}
      </div>

      {/* ── VSL video frame with glow ── */}
      <div className="vsl-wrap animate-in-delay-1">
        <div className="vsl-glow" aria-hidden="true" />
        <div className="vsl-stage">
          {video ? (
            isEmbeddable(video) ? (
              <iframe
                className="vsl-frame"
                src={video}
                title="Your onboarding video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video className="vsl-frame" src={video} controls playsInline />
            )
          ) : (
            <div className="vsl-placeholder">
              <div className="vsl-play">
                <span className="vsl-play-pulse" aria-hidden="true" />
                <FiPlay className="vsl-play-icon" aria-hidden="true" />
              </div>
              <span className="vsl-caption">Watch: what happens next</span>
            </div>
          )}
        </div>
      </div>

      {/* ── While you wait (prep) ── */}
      <div className="ab-prep animate-in-delay-2">
        <p className="ab-map-eyebrow">While you wait</p>
        <h2 className="ab-section-title">
          Three things you can do <span className="gradient-text">right now.</span>
        </h2>
        <div className="prep-grid">
          {PREP.map(({ Icon, title, text }) => (
            <div className="prep-card" key={title}>
              <span className="prep-icon">
                <Icon aria-hidden="true" />
              </span>
              <h3 className="prep-title">{title}</h3>
              <p className="prep-text">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── What happens next (process map) ── */}
      <div className="ab-map animate-in-delay-2">
        <p className="ab-map-eyebrow">What happens next</p>
        <h2 className="ab-section-title">
          Your roadmap, <span className="gradient-text">step by step.</span>
        </h2>

        <div className="stat-row" style={{ maxWidth: 640, margin: '0 auto 40px' }}>
          {STATS.map((s) => (
            <div className="stat-box" key={s.label}>
              <span className="stat-number">{s.number}</span>
              <span className="stat-label">{s.label}</span>
            </div>
          ))}
        </div>

        <div className="roadmap">
          <div className="roadmap-line" aria-hidden="true" />
          {STEPS.map(({ Icon, title, text }, i) => (
            <div className="roadmap-step" key={title}>
              <div className="roadmap-node">
                <Icon className="roadmap-icon" aria-hidden="true" />
                <span className="roadmap-num">{String(i + 1).padStart(2, '0')}</span>
                {i === 0 && <span className="roadmap-here" aria-hidden="true" />}
              </div>
              {i === 0 && <span className="roadmap-here-label">You are here</span>}
              <h3 className="roadmap-title">{title}</h3>
              <p className="roadmap-text">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── FAQ ── */}
      <div className="ab-faq animate-in-delay-2">
        <p className="ab-map-eyebrow">Good to know</p>
        <h2 className="ab-section-title">
          Quick <span className="gradient-text">answers.</span>
        </h2>
        <div className="faq-list">
          {FAQS.map(({ q, a }, i) => {
            const open = openFaq === i;
            return (
              <div className={`faq-item ${open ? 'faq-item--open' : ''}`} key={q}>
                <button
                  type="button"
                  className="faq-q"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                >
                  <span>{q}</span>
                  <FiChevronDown className={`faq-chevron ${open ? 'faq-chevron--open' : ''}`} aria-hidden="true" />
                </button>
                <div className="faq-a">
                  <p>{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ── Personal sign-off ── */}
      <div className="ab-signoff animate-in-delay-2">
        <p>
          {kickoffDay ? (
            <>
              See you on <strong className="gradient-text">{kickoffDay}, {prettyName}.</strong>
            </>
          ) : (
            <>
              See you at the kickoff, <strong className="gradient-text">{prettyName}.</strong>
            </>
          )}
        </p>
        <span className="ab-signoff-note">
          Something changed? Just reply to your onboarding email.
        </span>
      </div>
    </div>
  );
}