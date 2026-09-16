// src/lib/validate.ts
// Client-side field validation per screen — mirrors server logic closely
// so errors surface before submission, but the server re-validates anyway.

import type { OnboardPayload, ValidationErrors } from '../types';
import { DISCOVERY_KEYS } from '../content/options';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** Validate Screen 2 — Your details. */
export function validateDetails(
  form: OnboardPayload,
): ValidationErrors {
  const errs: ValidationErrors = {};

  if (form.fullName.trim().length < 2 || form.fullName.trim().length > 120) {
    errs.fullName = 'Full name must be 2–120 characters.';
  }
  if (form.businessName.trim() && (form.businessName.trim().length < 2 || form.businessName.trim().length > 120)) {
    errs.businessName = 'Business name must be 2–120 characters.';
  }
  if (!EMAIL_RE.test(form.email.trim())) {
    errs.email = 'Enter a valid email address.';
  }
  const digits = form.phone.replace(/\D/g, '');
  if (digits.length < 7 || digits.length > 15) {
    errs.phone = 'Phone number must contain 7–15 digits.';
  }

  return errs;
}

/** Validate Screen 3 — Your project. */
export function validateProject(
  form: OnboardPayload,
): ValidationErrors {
  const errs: ValidationErrors = {};
  if (!form.agentType) {
    errs.agentType = 'Select the AI agent you signed up for.';
  }
  return errs;
}

/** Validate Screen 4 — Tell us everything (textareas + chips). */
export function validateDiscovery(
  form: OnboardPayload,
): ValidationErrors {
  const errs: ValidationErrors = {};

  // Textarea answers (all required, 2–5000 chars).
  for (const key of DISCOVERY_KEYS) {
    const val = form.discovery[key]?.trim() ?? '';
    if (val.length < 2 || val.length > 5000) {
      errs[`discovery.${key}`] = 'Please answer this question (2–5000 characters).';
    }
  }

  // Chip selections (all required).
  const chipFields: [string, string][] = [
    ['heardAbout', 'Select where you first heard about us.'],
    ['industry', 'Select an industry from the list.'],
    ['revenueRange', 'Select your monthly revenue range.'],
    ['teamSize', 'Select your team size.'],
    ['yearsInBusiness', 'Select your years in business.'],
  ];
  for (const [field, msg] of chipFields) {
    if (!form[field as keyof OnboardPayload]) {
      errs[field] = msg;
    }
  }

  return errs;
}