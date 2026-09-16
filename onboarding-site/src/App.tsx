// src/App.tsx
// Root component — client-side state machine moving through 5 screens.
// Single route, no page reloads. All state in component state; persisted to
// /api/onboard on final submit.
import { useState, useCallback } from 'react';
import type { Screen, OnboardPayload, ValidationErrors } from './types';
import { emptyForm } from './types';
import { submitOnboard } from './lib/api';
import { validateDetails, validateProject, validateDiscovery } from './lib/validate';

import Logo from './components/Logo';
import ErrorBanner from './components/ErrorBanner';
import WelcomeScreen from './screens/WelcomeScreen';
import DetailsScreen from './screens/DetailsScreen';
import ProjectScreen from './screens/ProjectScreen';
import DiscoveryScreen from './screens/DiscoveryScreen';
import SuccessScreen from './screens/SuccessScreen';

export default function App() {
  const [screen, setScreen] = useState<Screen>(1);
  const [form, setForm] = useState<OnboardPayload>(emptyForm);
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // Partial updates to the top-level form fields.
  const updateForm = useCallback((patch: Partial<OnboardPayload>) => {
    setForm((prev) => ({ ...prev, ...patch }));
    // Clear any errors whose fields we just touched.
    setErrors((prev) => {
      const next = { ...prev };
      for (const key of Object.keys(patch)) {
        delete next[key];
      }
      return next;
    });
  }, []);

  // Update a single discovery textarea.
  const updateDiscovery = useCallback((key: string, value: string) => {
    setForm((prev) => ({
      ...prev,
      discovery: { ...prev.discovery, [key]: value },
    }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next[`discovery.${key}`];
      return next;
    });
  }, []);

  // Select an agent type (radio-style single select).
  const selectAgent = useCallback((type: string) => {
    setForm((prev) => ({ ...prev, agentType: type as OnboardPayload['agentType'] }));
    setErrors((prev) => {
      const next = { ...prev };
      delete next.agentType;
      return next;
    });
  }, []);

  // Screen 2 → 3
  const goDetailsToProject = useCallback(() => {
    const errs = validateDetails(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setScreen(2);
  }, [form]);

  // Screen 3 → 4
  const goProjectToDiscovery = useCallback(() => {
    const errs = validateProject(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setScreen(3);
  }, [form]);

  // Screen 4 → submit
  const submitDiscovery = useCallback(async () => {
    const errs = validateDiscovery(form);
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await submitOnboard(form);
      if (!res.ok) {
        setSubmitError(res.error ?? 'An unexpected error occurred.');
        return;
      }
      setScreen(5);
    } catch (e) {
      setSubmitError(
        e instanceof Error ? e.message : 'Network error — please try again.',
      );
    } finally {
      setSubmitting(false);
    }
  }, [form]);

  // Retry the last submission.
  const retrySubmit = useCallback(() => {
    submitDiscovery();
  }, [submitDiscovery]);

  // Start onboarding from welcome.
  const startOnboarding = useCallback(() => {
    setScreen(2);
  }, []);

  return (
    <div className="page">
      <Logo />

      {screen === 1 && <WelcomeScreen onStart={startOnboarding} />}

      {screen === 2 && (
        <DetailsScreen
          form={form}
          update={updateForm}
          errors={errors}
          onContinue={goDetailsToProject}
        />
      )}

      {screen === 3 && (
        <ProjectScreen
          form={form}
          selectAgent={selectAgent}
          errors={errors}
          onContinue={goProjectToDiscovery}
        />
      )}

      {screen === 4 && (
        <>
          {submitError && (
            <div style={{ width: '100%', maxWidth: 640 }}>
              <ErrorBanner message={submitError} onRetry={retrySubmit} />
            </div>
          )}
          <DiscoveryScreen
            form={form}
            updateDiscovery={updateDiscovery}
            update={updateForm}
            errors={errors}
            onSubmit={submitDiscovery}
          />
        </>
      )}

      {screen === 5 && <SuccessScreen firstName={form.fullName.split(' ')[0] || 'there'} />}

      {submitting && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(10,10,10,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
          }}
          role="status"
          aria-label="Submitting"
        >
          <div
            style={{
              padding: '24px 32px',
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-card)',
              textAlign: 'center',
              color: 'var(--text-secondary)',
              fontSize: 15,
            }}
          >
            Submitting your onboarding…
          </div>
        </div>
      )}
    </div>
  );
}