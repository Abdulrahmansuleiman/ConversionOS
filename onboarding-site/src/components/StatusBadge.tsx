// src/components/StatusBadge.tsx — phase status pill (Complete / In progress /
// Not started / Blocked), colored from theme.ts phaseStatusColor.
import styled from 'styled-components';
import { theme, phaseStatusColor } from '../theme';

export function StatusBadge({ status }: { status: string }) {
  const color = phaseStatusColor[status] ?? theme.colors.textFaint;
  return (
    <Badge $color={color}>
      <Dot $color={color} />
      {status}
    </Badge>
  );
}

const Badge = styled.span<{ $color: string }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 4px 10px;
  border-radius: 999px;
  font-family: ${theme.fonts.mono};
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => hexToRgba($color, 0.12)};
  border: 1px solid ${({ $color }) => hexToRgba($color, 0.28)};
  white-space: nowrap;
`;

const Dot = styled.span<{ $color: string }>`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 8px ${({ $color }) => $color};
`;

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}