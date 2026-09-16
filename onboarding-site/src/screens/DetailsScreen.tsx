// src/screens/DetailsScreen.tsx
// Screen 2 — Your details. Full name, business name, email, phone.
import type { OnboardPayload, ValidationErrors } from '../types';
import Stepper from '../components/Stepper';

interface Props {
  form: OnboardPayload;
  update: (patch: Partial<OnboardPayload>) => void;
  errors: ValidationErrors;
  onContinue: () => void;
}

export default function DetailsScreen({ form, update, errors, onContinue }: Props) {
  return (
    <div className="card">
      <Stepper currentStep={1} />
      <h2 className="h2">Your details</h2>
      <p className="body-text">How should we reach you?</p>

      <div className="field">
        <label className="field-label" htmlFor="fullName">Full name</label>
        <input
          id="fullName"
          className={`field-input ${errors.fullName ? 'error' : ''}`}
          value={form.fullName}
          onChange={(e) => update({ fullName: e.target.value })}
          placeholder="Your name"
        />
        {errors.fullName && <span className="field-error">{errors.fullName}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="businessName">Business name</label>
        <input
          id="businessName"
          className={`field-input ${errors.businessName ? 'error' : ''}`}
          value={form.businessName}
          onChange={(e) => update({ businessName: e.target.value })}
          placeholder="Your business name"
        />
        {errors.businessName && <span className="field-error">{errors.businessName}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="email">Email address</label>
        <input
          id="email"
          type="email"
          className={`field-input ${errors.email ? 'error' : ''}`}
          value={form.email}
          onChange={(e) => update({ email: e.target.value })}
          placeholder="you@company.com"
        />
        {errors.email && <span className="field-error">{errors.email}</span>}
      </div>

      <div className="field">
        <label className="field-label" htmlFor="phone">Phone number</label>
        <input
          id="phone"
          type="tel"
          className={`field-input ${errors.phone ? 'error' : ''}`}
          value={form.phone}
          onChange={(e) => update({ phone: e.target.value })}
          placeholder="+1 (555) 000-0000"
        />
        {errors.phone && <span className="field-error">{errors.phone}</span>}
      </div>

      <button className="primary-btn" onClick={onContinue}>
        Continue <span className="arrow">→</span>
      </button>
    </div>
  );
}