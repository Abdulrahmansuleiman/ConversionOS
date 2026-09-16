// src/components/Button.tsx — primary (accent) + ghost variants.
import styled from 'styled-components';
import { theme } from '../theme';

type Variant = 'primary' | 'ghost';

export function Button({
  children,
  variant = 'primary',
  disabled,
  onClick,
  type = 'button',
}: {
  children: React.ReactNode;
  variant?: Variant;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <Shell $variant={variant} type={type} disabled={disabled} onClick={onClick}>
      {children}
    </Shell>
  );
}

const Shell = styled.button<{ $variant: Variant }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 13px 22px;
  border-radius: ${theme.radii.md}px;
  font-family: ${theme.fonts.display};
  font-size: 15px;
  font-weight: 600;
  letter-spacing: 0.02em;
  transition: box-shadow 0.18s ease, transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
  border: 1px solid transparent;

  ${({ $variant }) =>
    $variant === 'primary'
      ? `
        background: ${theme.colors.accent};
        color: #FFFFFF;
        &:hover:not(:disabled) { box-shadow: ${theme.shadows.hover}; transform: translateY(-1px); }
      `
      : `
        background: transparent;
        color: ${theme.colors.text};
        border-color: ${theme.colors.border};
        &:hover:not(:disabled) { border-color: ${theme.colors.accent}; color: ${theme.colors.accent}; }
      `}

  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;