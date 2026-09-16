// src/components/Field.tsx — labeled form control + inline error.
// Styles any input/select/textarea child; error state turns the border negative.
import styled from 'styled-components';
import { theme } from '../theme';

export function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string | null;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Wrap $error={Boolean(error)}>
      <LabelRow>
        <Label>{label}</Label>
        {required ? <Required>*</Required> : null}
      </LabelRow>
      {children}
      {error ? <ErrorText role="alert">{error}</ErrorText> : null}
    </Wrap>
  );
}

const Wrap = styled.label<{ $error: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 7px;

  input,
  select,
  textarea {
    width: 100%;
    background: ${theme.colors.surface2};
    border: 1px solid ${({ $error }) => ($error ? theme.colors.negative : theme.colors.border)};
    border-radius: ${theme.radii.sm}px;
    color: ${theme.colors.text};
    padding: 12px 14px;
    font-size: 15px;
    font-family: ${theme.fonts.body};
    transition: border-color 0.15s ease, box-shadow 0.15s ease;

    &::placeholder {
      color: ${theme.colors.textFaint};
    }

    &:focus {
      outline: none;
      border-color: ${theme.colors.accent};
      box-shadow: 0 0 0 3px ${theme.colors.accentSoft};
    }

    &:disabled {
      opacity: 0.55;
      cursor: not-allowed;
    }
  }

  textarea {
    resize: vertical;
    min-height: 108px;
  }

  select {
    appearance: none;
    background-image: url("data:image/svg+xml;charset=utf8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%238B96AC' stroke-width='1.6' d='M1 1.5l5 5 5-5'/%3E%3C/svg%3E");
    background-repeat: no-repeat;
    background-position: right 14px center;
    padding-right: 36px;
    cursor: pointer;
  }
`;

const LabelRow = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const Label = styled.span`
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.02em;
`;

const Required = styled.span`
  color: ${theme.colors.accent};
  font-weight: 700;
`;

const ErrorText = styled.span`
  font-size: 12.5px;
  color: ${theme.colors.negative};
`;