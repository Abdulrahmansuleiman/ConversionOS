// src/screens/AfterBookingScreen.tsx
// Post-booking "your onboarding is being processed" page.
//
// REDIRECT TARGET for the booking calendar. Set the calendar's redirect URL
// to something like:
//   https://onboarding.launchopsai.click/after-booking?name=Alex&date=2026-10-02
// Supported query params (calendar merge fields vary by tool):
//   ?name= | ?first_name= | ?invitee_first_name=   → first name
//   ?date= | ?kickoff=                             → "Kickoff · Friday 2 October"
// Falls back to localStorage (saved when the client reached the booking
// screen) for name + agent type, then to graceful generic copy. No invented
// data ever renders — if a param is missing, that piece is simply omitted.
//
// VSL (video sales letter): paste the video URL into VSL_URL below. YouTube
// and Vimeo links render as embedded players; a direct .mp4 renders a
// <video>. Leave it '' to show the refined placeholder frame.

import { useState } from 'react';
import {
  FiPlay,
  FiMail,
  FiMessageCircle,
  FiCalendar,
  FiPlus,
} from 'react-icons/fi';

// ── Paste your VSL here ────────────────────────────────────────────────
//   YouTube: https://www.youtube.com/embed/VIDEO_ID
//   Vimeo:   https://player.vimeo.com/video/VIDEO_ID
//   Direct:  https://your-cdn.com/video.mp4
const VSL_URL = '';
// ───────────────────────────────────────────────────────────────────────

const STEPS = [
  {
    title: 'Kickoff call',
    text: 'We meet, open your roadmap together and lock the plan.',
  },
  {
    title: 'Design',
    text: "We design your AI agent's workflow, messaging and handoffs.",
  },
  {
    title: 'Build',
    text: 'We build and connect your agent to your systems.',
  },
  {
    title: 'Review',
    text: 'You test it live. We refine until it\u2019s right.',
  },
  {
    title: 'Launch',
    text: 'Your agent goes live and starts working for you.',
  },
  {
    title: 'Support',
    text: 'Post-launch support \u2014 monitoring, updates, growth.',
  },
] as const;

// "While you wait" — grounded in the real flow (Notion access request email,
// the WhatsApp group, weekly coaching calendar). Plain-spoken for trades
// businesses (solar / roofing clients).
const PREP = [
  {
    Icon: FiMail,
    title: 'Check your inbox',
    text: 'Your Notion invite lands within minutes of your request.',
  },
  {
    Icon: FiMessageCircle,
    title: 'We\u2019ll add you to WhatsApp',
    text: 'A group for 24/7 communication \u2014 no waiting on emails.',
  },
  {
    Icon: FiCalendar,
    title: 'Weekly coaching calls',
    text: 'Learn to build these systems for your own projects too.',
  },
] as const;

// Real questions clients ask; answers from the actual flow, not invented.
const FAQS = [
  {
    q: 'When do I get my Notion workspace access?',
    a: 'Click "Request access" on your onboarding page \u2014 it opens a ready-made email to us. We approve within minutes, and your roadmap link lands straight in your inbox.',
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
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
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

  const metaItems: string[] = [];
  if (agentType) metaItems.push(agentType);
  if (kickoffDay) metaItems.push(`Kickoff \u00b7 ${kickoffDay}`);
  metaItems.push('2\u20134 weeks to launch');

  return (
    <div className="page ab-page">
      {/* ── Minimal top bar ── */}
      <header className="ab-top">
        <img src="/logo.png" alt="LaunchOps" width={104} />
      </header>

      {/* ── Hero ── */}
      <section className="ab-hero">
        <div className="ab-eyebrow">
          <span className="ab-eyebrow-dot" aria-hidden="true" />
          Onboarding confirmed
        </div>
        <h1 className="ab-title">
          Hey {prettyName}, your onboarding is being <em>processed.</em>
        </h1>
        <p className="ab-sub">
          Everything is queued. Watch the short video below — then follow your roadmap.
          It&apos;s all handled.
        </p>

        {metaItems.length > 0 && (
          <ul className="ab-meta">
            {metaItems.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        )}
      </section>

      {/* ── VSL video frame ── */}
      <section className="ab-vsl">
        <div className="ab-vsl-frame">
          {video ? (
            isEmbeddable(video) ? (
              <iframe
                className="ab-vsl-embed"
                src={video}
                title="Your onboarding video"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video className="ab-vsl-embed" src={video} controls playsInline />
            )
          ) : (
            <div className="ab-vsl-placeholder">
              <span className="ab-play" role="presentation">
                <FiPlay aria-hidden="true" />
              </span>
              <span className="ab-vsl-line">What happens next</span>
            </div>
          )}
        </div>
      </section>

      {/* ── Your roadmap ── */}
      <section className="ab-section">
        <div className="ab-section-head">
          <span className="ab-kicker">Your roadmap</span>
          <h2 className="ab-section-title">What happens next</h2>
        </div>

        <ol className="ab-rail">
          {STEPS.map((step, i) => {
            const isNow = i === 0;
            return (
              <li className={`ab-step${isNow ? ' ab-step--now' : ''}`} key={step.title}>
                <span className="ab-step-num">{String(i + 1).padStart(2, '0')}</span>
                <div className="ab-step-body">
                  <div className="ab-step-head">
                    <h3 className="ab-step-title">{step.title}</h3>
                    {isNow && <span className="ab-step-tag">Current</span>}
                  </div>
                  <p className="ab-step-text">{step.text}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </section>

      {/* ── While you wait ── */}
      <section className="ab-section">
        <div className="ab-section-head">
          <span className="ab-kicker">While you wait</span>
          <h2 className="ab-section-title">Three things you can do now</h2>
        </div>

        <div className="ab-prep-grid">
          {PREP.map(({ Icon, title, text }) => (
            <div className="ab-prep-cell" key={title}>
              <Icon className="ab-prep-icon" aria-hidden="true" />
              <h3 className="ab-prep-title">{title}</h3>
              <p className="ab-prep-text">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── FAQ ── */}
      <section className="ab-section">
        <div className="ab-section-head">
          <span className="ab-kicker">Good to know</span>
          <h2 className="ab-section-title">Quick answers</h2>
        </div>

        <div className="ab-faq-list">
          {FAQS.map(({ q, a }, i) => {
            const open = openFaq === i;
            return (
              <div className={`ab-faq-item${open ? ' ab-faq-item--open' : ''}`} key={q}>
                <button
                  type="button"
                  className="ab-faq-q"
                  onClick={() => setOpenFaq(open ? null : i)}
                  aria-expanded={open}
                >
                  <span>{q}</span>
                  <FiPlus className={`ab-faq-icon${open ? ' ab-faq-icon--open' : ''}`} aria-hidden="true" />
                </button>
                <div className="ab-faq-a">
                  <p>{a}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Sign-off ── */}
      <footer className="ab-foot">
        <p className="ab-signoff">
          {kickoffDay ? (
            <>
              See you on <strong>{kickoffDay}</strong>, <strong>{prettyName}.</strong>
            </>
          ) : (
            <>
              See you at the kickoff, <strong>{prettyName}.</strong>
            </>
          )}
        </p>
        <p className="ab-signoff-note">
          Questions anytime — we&apos;re a message away.
        </p>
      </footer>
    </div>
  );
}