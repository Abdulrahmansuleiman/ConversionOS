// src/lib/validate.ts — wizard field validators.
// Rules mirror the server's re-validation (server/onboarding.js) exactly:
// they share the same shapes from BUILD_SPEC §4.2 / §5.2.
import { AGENT_TYPES, INDUSTRIES, TEAM_SIZES } from '../content/options';

export type WizardForm = {
  fullName: string;
  email: string;
  phone: string;
  company: string;
  website: string;
  industry: string;
  teamSize: string;
  agentType: string;
  mainGoal: string;
  currentProcess: string;
  anythingElse: string;
};

export type ValidationErrors = Partial<Record<keyof WizardForm, string>>;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateField(field: keyof WizardForm, value: string, _form: WizardForm): string | null {
  switch (field) {
    case 'fullName': {
      const v = value.trim();
      return v.length >= 2 && v.length <= 120 ? null : 'Full name must be 2–120 characters.';
    }
    case 'email': {
      const v = value.trim();
      return EMAIL_RE.test(v) ? null : 'Enter a valid email address.';
    }
    case 'phone': {
      const digits = value.replace(/\D/g, '');
      return digits.length >= 7 && digits.length <= 15 ? null : 'Phone number must contain 7–15 digits.';
    }
    case 'company': {
      const v = value.trim();
      if (!v) return null;
      return v.length >= 2 && v.length <= 120 ? null : 'Company name must be 2–120 characters.';
    }
    case 'website': {
      const v = value.trim();
      if (!v) return null;
      let parsed: URL | null;
      try {
        parsed = new URL(v);
      } catch {
        parsed = null;
      }
      return parsed && (parsed.protocol === 'http:' || parsed.protocol === 'https:')
        ? null
        : 'Website must be a valid http(s) URL.';
    }
    case 'industry':
      return (INDUSTRIES as readonly string[]).includes(value) ? null : 'Select an industry from the list.';
    case 'teamSize':
      return (TEAM_SIZES as readonly string[]).includes(value) ? null : 'Select a team size from the list.';
    case 'agentType':
      return (AGENT_TYPES as readonly string[]).includes(value) ? null : 'Select an agent type from the list.';
    case 'mainGoal': {
      const v = value.trim();
      return v.length >= 10 && v.length <= 2000 ? null : 'Main goal must be 10–2000 characters.';
    }
    case 'currentProcess': {
      const v = value.trim();
      return v.length >= 10 && v.length <= 2000 ? null : 'Current process must be 10–2000 characters.';
    }
    case 'anythingElse': {
      const v = value.trim();
      return v.length <= 2000 ? null : 'Anything else must be at most 2000 characters.';
    }
    default:
      return null;
  }
}

// Step boundaries: 1 Contact · 2 Company · 3 Project · 4 Review.
export const STEP_FIELDS: Array<Array<keyof WizardForm>> = [
  ['fullName', 'email', 'phone'],
  ['company', 'website', 'industry', 'teamSize'],
  ['agentType', 'mainGoal', 'currentProcess', 'anythingElse'],
];

export function validateStep(step: number, form: WizardForm): ValidationErrors {
  const errors: ValidationErrors = {};
  const fields = STEP_FIELDS[step - 1];
  if (!fields) return errors;
  // The form object is passed so optional-field logic can inspect it if ever needed.
  const _form = form;
  for (const field of fields) {
    const message = validateField(field, form[field], _form);
    if (message) errors[field] = message;
  }
  return errors;
}

export const emptyForm = (): WizardForm => ({
  fullName: '',
  email: '',
  phone: '',
  company: '',
  website: '',
  industry: '',
  teamSize: '',
  agentType: '',
  mainGoal: '',
  currentProcess: '',
  anythingElse: '',
});