// src/components/Pill.tsx — eyebrow pill (accentSoft bg, accent text) with a
// pulsing accent dot (matches Raymon's reference layout).
import styled, { keyframes } from 'styled-components';
import { theme } from '../theme';

export function Pill({ children }: { children: React.ReactNode }) {
  return (
    <Wrap>
      <Pulse />
      <span>{children}</span>
    </Wrap>
  );
}

const pulse = keyframes`
  0%   { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0.45); }
  70%  { box-shadow: 0 0 0 7px rgba(37, 99, 235, 0); }
  100% { box-shadow: 0 0 0 0 rgba(37, 99, 235, 0); }
`;

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 14px;
  border-radius: 999px;
  background: ${theme.colors.accentSoft};
  border: 1px solid ${theme.colors.border};
  color: ${theme.colors.accent};
  font-family: ${theme.fonts.body};
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
`;

const Pulse = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${theme.colors.accent};
  animation: ${pulse} 2s ease-out infinite;
`;