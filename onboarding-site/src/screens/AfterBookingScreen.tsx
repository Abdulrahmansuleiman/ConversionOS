// src/screens/AfterBookingScreen.tsx
// Post-booking "your onboarding is being processed" page.
//
// This page is the REDIRECT TARGET for the booking calendar. Set the calendar's
// redirect/thank-you URL to something like:
//   https://onboarding.launchopsai.click/after-booking?name=Alex
// The name is picked up from (in order):
//   1. ?name= / ?first_name= / ?invitee_first_name= query param (what calendar
//      tools commonly inject), then
//   2. localStorage (saved automatically when the client reached the booking
//      screen on this site — screens 2–5 store the name), then
//   3. the generic fallback "there".
//
// VSL (video sales letter): paste the video URL into VSL_URL below. YouTube and
// Vimeo links render as embedded players; a direct .mp4 renders a <video>.
// Leave it '' to show the glowing placeholder frame until the video is ready.

import { FiCalendar, FiPenTool, FiTool, FiCheckCircle, FiSend, FiTrendingUp, FiPlay } from 'react-icons/fi';

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

function isEmbeddable(url: string): boolean {
  return /youtube\.com|youtu\.be|vimeo\.com/.test(url);
}

function pretty(name: string): string {
  return name ? name.charAt(0).toUpperCase() + name.slice(1) : 'there';
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
  const video = VSL_URL.trim();

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

      {/* ── What happens next (process map) ── */}
      <div className="ab-map animate-in-delay-2">
        <p className="eyebrow ab-map-eyebrow">What happens next</p>
        <h2 className="ab-map-title">
          Your roadmap, <span className="gradient-text">step by step.</span>
        </h2>

        <div className="roadmap">
          <div className="roadmap-line" aria-hidden="true" />
          {STEPS.map(({ Icon, title, text }, i) => (
            <div className="roadmap-step" key={title}>
              <div className="roadmap-node">
                <Icon className="roadmap-icon" aria-hidden="true" />
                <span className="roadmap-num">{String(i + 1).padStart(2, '0')}</span>
              </div>
              <h3 className="roadmap-title">{title}</h3>
              <p className="roadmap-text">{text}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Personal sign-off ── */}
      <div className="ab-signoff animate-in-delay-2">
        <p>
          See you at the kickoff, <strong className="gradient-text">{prettyName}.</strong>
        </p>
        <span className="ab-signoff-note">
          Something changed? Just reply to your onboarding email.
        </span>
      </div>
    </div>
  );
}