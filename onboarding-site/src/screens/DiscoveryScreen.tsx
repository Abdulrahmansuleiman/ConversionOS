// src/screens/DiscoveryScreen.tsx
// Screen 4 — Tell us everything. Textareas + chip-select rows, grouped by section.
import type { OnboardPayload, ValidationErrors } from '../types';
import {
  DISCOVERY_QUESTIONS,
  HEARD_ABOUT,
  INDUSTRIES,
  REVENUE_RANGES,
  TEAM_SIZES,
  YEARS_IN_BUSINESS,
} from '../content/options';
import Stepper from '../components/Stepper';

interface Props {
  form: OnboardPayload;
  updateDiscovery: (key: string, value: string) => void;
  update: (patch: Partial<OnboardPayload>) => void;
  errors: ValidationErrors;
  onSubmit: () => void;
}

export default function DiscoveryScreen({
  form,
  updateDiscovery,
  update,
  errors,
  onSubmit,
}: Props) {
  const disc = form.discovery;

  return (
    <div className="card">
      <Stepper currentStep={3} />
      <h2 className="h2">Tell us everything</h2>
      <p className="body-text">
        This helps us serve you better. Takes about 3 minutes.
      </p>

      {/* --- THE DECISION --- */}
      <span className="section-divider"><span>The Decision</span></span>
      {DISCOVERY_QUESTIONS.slice(0, 5).map((q) => (
        <TextField
          key={q.key}
          label={q.label}
          placeholder={q.placeholder}
          value={disc[q.key]}
          onChange={(v) => updateDiscovery(q.key, v)}
          error={errors[`discovery.${q.key}`]}
        />
      ))}

      {/* --- WHAT CONVINCED YOU --- */}
      <span className="section-divider"><span>What Convinced You</span></span>
      {DISCOVERY_QUESTIONS.slice(5, 7).map((q) => (
        <TextField
          key={q.key}
          label={q.label}
          placeholder={q.placeholder}
          value={disc[q.key]}
          onChange={(v) => updateDiscovery(q.key, v)}
          error={errors[`discovery.${q.key}`]}
        />
      ))}

      {/* --- THE STAKES (2-col on desktop) --- */}
      <span className="section-divider"><span>The Stakes</span></span>
      <div className="stakes-grid">
        {DISCOVERY_QUESTIONS.slice(7, 9).map((q) => (
          <TextField
            key={q.key}
            label={q.label}
            placeholder={q.placeholder}
            value={disc[q.key]}
            onChange={(v) => updateDiscovery(q.key, v)}
            error={errors[`discovery.${q.key}`]}
          />
        ))}
      </div>

      {/* --- Full-width question --- */}
      {(() => {
        const q = DISCOVERY_QUESTIONS[9];
        return (
          <TextField
            label={q.label}
            placeholder={q.placeholder}
            value={disc[q.key]}
            onChange={(v) => updateDiscovery(q.key, v)}
            error={errors[`discovery.${q.key}`]}
            fullWidth
          />
        );
      })()}

      {/* --- ABOUT YOUR BUSINESS (chip-select rows) --- */}
      <span className="section-divider"><span>About Your Business</span></span>

      <ChipGroup
        label="Where did you first hear about us?"
        options={HEARD_ABOUT}
        value={form.heardAbout}
        onChange={(v) => update({ heardAbout: v })}
        error={errors.heardAbout}
      />
      <ChipGroup
        label="Industry"
        options={INDUSTRIES}
        value={form.industry}
        onChange={(v) => update({ industry: v })}
        error={errors.industry}
      />
      <ChipGroup
        label="Monthly revenue range"
        options={REVENUE_RANGES}
        value={form.revenueRange}
        onChange={(v) => update({ revenueRange: v })}
        error={errors.revenueRange}
      />
      <ChipGroup
        label="Team size"
        options={TEAM_SIZES}
        value={form.teamSize}
        onChange={(v) => update({ teamSize: v })}
        error={errors.teamSize}
      />
      <ChipGroup
        label="Years in business"
        options={YEARS_IN_BUSINESS}
        value={form.yearsInBusiness}
        onChange={(v) => update({ yearsInBusiness: v })}
        error={errors.yearsInBusiness}
      />

      <button className="primary-btn" onClick={onSubmit}>
        Complete onboarding <span className="arrow">→</span>
      </button>
    </div>
  );
}

/* ---- Tiny inline helpers (not worth their own files) ---- */

function TextField({
  label,
  placeholder,
  value,
  onChange,
  error,
  fullWidth,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  fullWidth?: boolean;
}) {
  return (
    <div className="field">
      <label className="field-label">{label}</label>
      <textarea
        className={`field-textarea ${fullWidth ? 'full-width' : ''} ${error ? 'error' : ''}`}
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}

function ChipGroup({
  label,
  options,
  value,
  onChange,
  error,
}: {
  label: string;
  options: readonly string[];
  value: string;
  onChange: (v: string) => void;
  error?: string;
}) {
  return (
    <div className="field">
      <span className="field-label">{label}</span>
      <div className="chip-group">
        {options.map((opt) => (
          <button
            key={opt}
            className={`chip ${value === opt ? 'selected' : ''}`}
            onClick={() => onChange(opt)}
          >
            {opt}
          </button>
        ))}
      </div>
      {error && <span className="field-error">{error}</span>}
    </div>
  );
}