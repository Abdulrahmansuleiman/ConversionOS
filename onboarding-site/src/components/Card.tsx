// src/components/Card.tsx — surface card (surface bg, border, lg radius).
import styled from 'styled-components';
import { theme } from '../theme';

export function Card({ children, className }: { children: React.ReactNode; className?: string }) {
  return <Shell className={className}>{children}</Shell>;
}

const Shell = styled.div`
  background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.surface2} 100%);
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.lg}px;
  box-shadow: ${theme.shadows.card};
  padding: 26px;
`;