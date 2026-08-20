// src/tabs/SettingsTab.tsx — ADD PEOPLE: name / email / role, persisted through
// the UserStore (spec §1.1/§4.10). Duplicate email -> 409 message shown in UI.
import { useState, type FormEvent } from 'react';
import styled from 'styled-components';
import { useUsers } from '../hooks/useUsers';
import { ApiError } from '../api/client';
import { formatDate } from '../utils/format';
import { Card, CardHeader, CardSub, CardTitle, Table, Td, Th, Tr } from '../components/ui';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { Pill } from '../components/ui';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const Layout = styled.div`
  display: grid;
  grid-template-columns: 1fr 1.6fr;
  gap: 16px;
  align-items: start;

  @media (max-width: 960px) {
    grid-template-columns: 1fr;
  }
`;

const Form = styled.form`
  padding: 18px 20px;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Field = styled.label`
  display: flex;
  flex-direction: column;
  gap: 5px;
  font-size: 12px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const Input = styled.input`
  border: 1px solid ${(p) => p.theme.colors.borderStrong};
  border-radius: 8px;
  padding: 9px 12px;
  font-size: 13.5px;
  color: ${(p) => p.theme.colors.textPrimary};
  background: ${(p) => p.theme.colors.surface};

  &:focus {
    outline: none;
    border-color: ${(p) => p.theme.colors.accent};
  }
`;

const RoleHint = styled.div`
  font-size: 11px;
  color: ${(p) => p.theme.colors.textMuted};
  margin-top: -4px;
`;

const SubmitButton = styled.button`
  border: none;
  background: ${(p) => p.theme.colors.accent};
  color: #fff;
  font-weight: 700;
  font-size: 13.5px;
  padding: 10px 16px;
  border-radius: ${(p) => p.theme.radii.button};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover:not(:disabled) {
    background: ${(p) => p.theme.colors.accentHover};
  }

  &:disabled {
    opacity: 0.55;
    cursor: not-allowed;
  }
`;

const ErrorBox = styled.div`
  background: rgba(232, 106, 95, 0.12);
  border: 1px solid rgba(232, 106, 95, 0.4);
  color: ${(p) => p.theme.colors.negative};
  font-size: 12.5px;
  font-weight: 600;
  padding: 9px 12px;
  border-radius: 8px;
`;

const FieldError = styled.div`
  color: ${(p) => p.theme.colors.negative};
  font-size: 11.5px;
  font-weight: 500;
`;

export function SettingsTab() {
  const users = useUsers();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string; role?: string }>({});
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const errors: { name?: string; email?: string; role?: string } = {};
    if (!name.trim()) errors.name = 'Name is required';
    if (!EMAIL_RE.test(email.trim())) errors.email = 'Enter a valid email address';
    if (!role.trim()) errors.role = 'Role is required';
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    setSubmitError(null);
    try {
      await users.addUser({ name: name.trim(), email: email.trim(), role: role.trim() });
      setName('');
      setEmail('');
      setRole('');
    } catch (err) {
      // Fail loud: show the server's message (409 duplicate email, etc.).
      const message = err instanceof ApiError ? err.message : 'Failed to add person. Please try again.';
      setSubmitError(message);
      console.error('[settings] add user failed:', err);
    }
  };

  return (
    <Layout>
      <Card>
        <CardHeader>
          <div>
            <CardTitle>Add person</CardTitle>
            <CardSub>People who can view this agent report</CardSub>
          </div>
        </CardHeader>
        <Form onSubmit={handleSubmit} noValidate>
          <Field>
            Name
            <Input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Alex Morgan"
              autoComplete="off"
            />
            {fieldErrors.name ? <FieldError>{fieldErrors.name}</FieldError> : null}
          </Field>
          <Field>
            Email
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="e.g. alex@bloomlineapparel.com"
              autoComplete="off"
            />
            {fieldErrors.email ? <FieldError>{fieldErrors.email}</FieldError> : null}
          </Field>
          <Field>
            Role
            <Input
              type="text"
              list="role-suggestions"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              placeholder="Owner, Manager or Viewer"
              autoComplete="off"
            />
            <datalist id="role-suggestions">
              <option value="Owner" />
              <option value="Manager" />
              <option value="Viewer" />
            </datalist>
            <RoleHint>Suggested: Owner / Manager / Viewer — free text is fine</RoleHint>
            {fieldErrors.role ? <FieldError>{fieldErrors.role}</FieldError> : null}
          </Field>
          {submitError ? <ErrorBox role="alert">{submitError}</ErrorBox> : null}
          <SubmitButton type="submit" disabled={users.adding}>
            {users.adding ? 'Adding…' : 'Add person'}
          </SubmitButton>
        </Form>
      </Card>

      <Card>
        <CardHeader>
          <div>
            <CardTitle>People</CardTitle>
            <CardSub>Dashboard viewers added so far</CardSub>
          </div>
        </CardHeader>
        {users.error ? (
          <ErrorState message={`Failed to load people: ${users.error}`} onRetry={users.retry} />
        ) : users.loading ? (
          <EmptyState title="Loading people…" />
        ) : !users.data || users.data.length === 0 ? (
          <EmptyState
            title="No people added yet"
            message="Add the first person on the left — they'll appear here."
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <Table>
              <thead>
                <Tr>
                  <Th>Name</Th>
                  <Th>Email</Th>
                  <Th>Role</Th>
                  <Th>Added</Th>
                </Tr>
              </thead>
              <tbody>
                {users.data.map((u) => (
                  <Tr key={u.id}>
                    <Td style={{ fontWeight: 600 }}>{u.name}</Td>
                    <Td>{u.email}</Td>
                    <Td>
                      <Pill $tone="neutral">{u.role}</Pill>
                    </Td>
                    <Td>{formatDate(u.created_at)}</Td>
                  </Tr>
                ))}
              </tbody>
            </Table>
          </div>
        )}
      </Card>
    </Layout>
  );
}
