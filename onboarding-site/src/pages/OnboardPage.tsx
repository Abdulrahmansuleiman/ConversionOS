// src/pages/OnboardPage.tsx — 4-step onboarding wizard (§4.2).
// State holds ONLY what the client types — no defaults, no prefill (BUILD_SPEC §6.1).
// Success UI renders only when the API returned ok === true (§6.3).
import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FiArrowLeft, FiArrowRight, FiCheckCircle, FiEdit2 } from 'react-icons/fi';
import styled from 'styled-components';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { Field } from '../components/Field';
import { Logo } from '../components/Logo';
import { StepIndicator } from '../components/StepIndicator';
import { AGENT_TYPES, INDUSTRIES, TEAM_SIZES } from '../content/options';
import { copy } from '../content/copy';
import { ApiError, apiFetch } from '../lib/api';
import { STEP_FIELDS, ValidationErrors, WizardForm, emptyForm, validateStep } from '../lib/validate';
import { theme } from '../theme';

type OnboardResponse = {
  ok: true;
  projectId: string;
  clientSlug: string;
  statusUrl: string;
  projectName: string;
};

type SubmitState = 'idle' | 'submitting' | 'success' | 'error';

const REVIEW_GROUPS: Array<{ step: number; title: string; fields: Array<keyof WizardForm> }> = [
  { step: 1, title: 'Contact', fields: ['fullName', 'email', 'phone'] },
  { step: 2, title: 'Company', fields: ['company', 'website', 'industry', 'teamSize'] },
  { step: 3, title: 'Project', fields: ['agentType', 'mainGoal', 'currentProcess', 'anythingElse'] },
];

export default function OnboardPage() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>(emptyForm());
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitState, setSubmitState] = useState<SubmitState>('idle');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [result, setResult] = useState<OnboardResponse | null>(null);
  const refs = useRef<Record<string, HTMLElement | null>>({});

  const set = (field: keyof WizardForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
  };

  const bindRef = (field: keyof WizardForm) => (el: HTMLElement | null) => {
    refs.current[field] = el;
  };

  const goNext = () => {
    const errs = validateStep(step, form);
    setErrors(errs);
    const firstBad = STEP_FIELDS[step - 1]?.find((f) => errs[f]);
    if (firstBad) {
      refs.current[firstBad]?.focus();
      return;
    }
    setErrors({});
    setStep((s) => s + 1);
  };

  const goBack = () => {
    setErrors({});
    setStep((s) => Math.max(1, s - 1));
  };

  const jumpTo = (target: number) => {
    setErrors({});
    setStep(target);
  };

  const submit = async () => {
    setSubmitState('submitting');
    setErrorMessage(null);
    try {
      const res = await apiFetch<OnboardResponse>('/api/onboard', {
        method: 'POST',
        body: JSON.stringify(form),
      });
      setResult(res);
      setSubmitState('success');
    } catch (e) {
      setErrorMessage(e instanceof ApiError ? e.message : 'Something went wrong. Please try again.');
      setSubmitState('error');
    }
  };

  // --- Completion screen (§4.2) — rendered ONLY after ok === true ---
  if (submitState === 'success' && result) {
    let statusPath = result.statusUrl;
    try {
      statusPath = new URL(result.statusUrl, window.location.origin).pathname;
    } catch {
      // statusUrl is already a relative path — use as-is.
    }
    return (
      <Shell>
        <Header>
          <Logo />
        </Header>
        <Center>
          <Card>
            <SuccessIcon />
            <SuccessTitle>{copy.wizard.completionTitle}</SuccessTitle>
            <Body>
              {copy.wizard.completionBody.map((line) => (
                <li key={line}>{line}</li>
              ))}
            </Body>
            <Buttons>
              <Link to={statusPath}>
                <Button>{copy.wizard.viewStatus}</Button>
              </Link>
              <Link to="/">
                <Button variant="ghost">{copy.wizard.backHome}</Button>
              </Link>
            </Buttons>
          </Card>
        </Center>
      </Shell>
    );
  }

  return (
    <Shell>
      <Header>
        <Logo />
      </Header>
      <Center>
        <Card>
          <StepIndicator steps={copy.wizard.steps} current={step} />
          <FormBody>
            {step === 1 && (
              <>
                <Field label={copy.wizard.fields.fullName.label} required error={errors.fullName}>
                  <input
                    ref={bindRef('fullName')}
                    type="text"
                    value={form.fullName}
                    onChange={set('fullName')}
                    placeholder={copy.wizard.fields.fullName.placeholder}
                  />
                </Field>
                <Field label={copy.wizard.fields.email.label} required error={errors.email}>
                  <input
                    ref={bindRef('email')}
                    type="email"
                    value={form.email}
                    onChange={set('email')}
                    placeholder={copy.wizard.fields.email.placeholder}
                  />
                </Field>
                <Field label={copy.wizard.fields.phone.label} required error={errors.phone}>
                  <input
                    ref={bindRef('phone')}
                    type="tel"
                    value={form.phone}
                    onChange={set('phone')}
                    placeholder={copy.wizard.fields.phone.placeholder}
                  />
                </Field>
              </>
            )}

            {step === 2 && (
              <>
                <Field label={copy.wizard.fields.company.label} error={errors.company}>
                  <input
                    ref={bindRef('company')}
                    type="text"
                    value={form.company}
                    onChange={set('company')}
                    placeholder={copy.wizard.fields.company.placeholder}
                  />
                </Field>
                <Field label={copy.wizard.fields.website.label} error={errors.website}>
                  <input
                    ref={bindRef('website')}
                    type="url"
                    value={form.website}
                    onChange={set('website')}
                    placeholder={copy.wizard.fields.website.placeholder}
                  />
                </Field>
                <Field label={copy.wizard.fields.industry.label} required error={errors.industry}>
                  <select ref={bindRef('industry')} value={form.industry} onChange={set('industry')}>
                    <option value="">{copy.wizard.fields.industry.placeholder}</option>
                    {INDUSTRIES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={copy.wizard.fields.teamSize.label} required error={errors.teamSize}>
                  <select ref={bindRef('teamSize')} value={form.teamSize} onChange={set('teamSize')}>
                    <option value="">{copy.wizard.fields.teamSize.placeholder}</option>
                    {TEAM_SIZES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
              </>
            )}

            {step === 3 && (
              <>
                <Field label={copy.wizard.fields.agentType.label} required error={errors.agentType}>
                  <select ref={bindRef('agentType')} value={form.agentType} onChange={set('agentType')}>
                    <option value="">{copy.wizard.fields.agentType.placeholder}</option>
                    {AGENT_TYPES.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label={copy.wizard.fields.mainGoal.label} required error={errors.mainGoal}>
                  <textarea
                    ref={bindRef('mainGoal')}
                    value={form.mainGoal}
                    onChange={set('mainGoal')}
                    placeholder={copy.wizard.fields.mainGoal.placeholder}
                  />
                </Field>
                <Field label={copy.wizard.fields.currentProcess.label} required error={errors.currentProcess}>
                  <textarea
                    ref={bindRef('currentProcess')}
                    value={form.currentProcess}
                    onChange={set('currentProcess')}
                    placeholder={copy.wizard.fields.currentProcess.placeholder}
                  />
                </Field>
                <Field label={copy.wizard.fields.anythingElse.label} error={errors.anythingElse}>
                  <textarea
                    ref={bindRef('anythingElse')}
                    value={form.anythingElse}
                    onChange={set('anythingElse')}
                    placeholder={copy.wizard.fields.anythingElse.placeholder}
                  />
                </Field>
              </>
            )}

            {step === 4 && (
              <ReviewBlock>
                {REVIEW_GROUPS.map((group) => (
                  <Group key={group.title}>
                    <GroupHeader>
                      <GroupTitle>{group.title}</GroupTitle>
                      <EditButton onClick={() => jumpTo(group.step)}>
                        <FiEdit2 /> {copy.wizard.edit}
                      </EditButton>
                    </GroupHeader>
                    <GroupList>
                      {group.fields.map((field) => (
                        <GroupItem key={field}>
                          <GroupLabel>{copy.wizard.fields[field].label}</GroupLabel>
                          <GroupValue>{form[field].trim() ? form[field] : '—'}</GroupValue>
                        </GroupItem>
                      ))}
                    </GroupList>
                  </Group>
                ))}
                {submitState === 'error' && errorMessage ? (
                  <ErrorBanner message={errorMessage} onRetry={submit} />
                ) : null}
              </ReviewBlock>
            )}
          </FormBody>
          <NavRow>
            {step > 1 ? (
              <Button variant="ghost" onClick={goBack} disabled={submitState === 'submitting'}>
                <FiArrowLeft /> {copy.wizard.back}
              </Button>
            ) : (
              <span />
            )}
            {step < 4 ? (
              <Button onClick={goNext}>
                {copy.wizard.next} <FiArrowRight />
              </Button>
            ) : (
              <Button onClick={submit} disabled={submitState === 'submitting'}>
                {submitState === 'submitting' ? copy.wizard.submitting : copy.wizard.submit}
              </Button>
            )}
          </NavRow>
        </Card>
      </Center>
    </Shell>
  );
}

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 48px;
`;

const Header = styled.header`
  width: 100%;
  max-width: 1080px;
  padding: 26px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Center = styled.main`
  width: 100%;
  max-width: 560px;
  padding: 0 20px;
`;

const FormBody = styled.div`
  margin-top: 28px;
  display: flex;
  flex-direction: column;
  gap: 18px;
`;

const NavRow = styled.div`
  margin-top: 28px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
`;

const ReviewBlock = styled.div`
  display: flex;
  flex-direction: column;
  gap: 22px;
`;

const Group = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const GroupHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-bottom: 8px;
  border-bottom: 1px solid ${theme.colors.borderSoft};
`;

const GroupTitle = styled.h3`
  font-family: ${theme.fonts.display};
  font-size: 15px;
  font-weight: 600;
  color: ${theme.colors.accent};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const EditButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: transparent;
  border: none;
  color: ${theme.colors.accent};
  font-size: 13px;
  font-weight: 600;
  padding: 4px 8px;
  border-radius: ${theme.radii.sm}px;

  &:hover {
    background: ${theme.colors.accentSoft};
  }
`;

const GroupList = styled.dl`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
`;

const GroupItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
`;

const GroupLabel = styled.dt`
  font-size: 12px;
  font-weight: 600;
  color: ${theme.colors.textFaint};
  text-transform: uppercase;
  letter-spacing: 0.05em;
`;

const GroupValue = styled.dd`
  font-size: 15px;
  color: ${theme.colors.text};
  white-space: pre-wrap;
  word-break: break-word;
`;

const SuccessIcon = styled(FiCheckCircle)`
  font-size: 52px;
  color: ${theme.colors.positive};
`;

const SuccessTitle = styled.h2`
  font-family: ${theme.fonts.display};
  font-size: 30px;
  font-weight: 700;
  color: ${theme.colors.text};
`;

const Body = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  font-size: 15px;
  line-height: 1.55;
  color: ${theme.colors.textMuted};
`;

const Buttons = styled.div`
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
`;