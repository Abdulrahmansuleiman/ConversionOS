// src/components/Pill.tsx — eyebrow pill (accentSoft bg, accent text).
import styled from 'styled-components';
import { theme } from '../theme';

export function Pill({ children }: { children: React.ReactNode }) {
  return <Wrap>{children}</Wrap>;
}

const Wrap = styled.span`
  display: inline-flex;
  align-items: center;
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