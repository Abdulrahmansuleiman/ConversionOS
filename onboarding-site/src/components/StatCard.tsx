// src/components/StatCard.tsx — landing stat card.
// value === null renders "—" (BUILD_SPEC §6.2): we never guess a number.
import styled from 'styled-components';
import { theme } from '../theme';
import type { Stat } from '../content/stats';

export function StatCard({ stat }: { stat: Stat }) {
  // value may be number | string | null. Null (unconfirmed) renders "—";
  // strings like "2-4 weeks" or "2-3x" render verbatim — no numeric
  // formatting is ever applied to values that could be strings.
  const display = stat.value === null ? '—' : String(stat.value) + (stat.unit ? ` ${stat.unit}` : '');
  return (
    <Shell>
      <Value>{display}</Value>
      <Label>{stat.label}</Label>
    </Shell>
  );
}

const Shell = styled.div`
  background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.surface2} 100%);
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.lg}px;
  box-shadow: ${theme.shadows.card};
  padding: 20px 16px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
`;

const Value = styled.div`
  font-family: ${theme.fonts.display};
  font-size: 36px;
  font-weight: 900;
  letter-spacing: -0.01em;
  color: ${theme.colors.accent};
  line-height: 1.1;
  white-space: nowrap;
`;

const Label = styled.div`
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.textMuted};
  letter-spacing: 0.03em;
`;