// src/components/KpiCard.tsx — dark KPI card: label, value, change badge,
// colored dot (spec §3.3 / reference-image styling).
import styled from 'styled-components';
import type { Change } from '../types/changes';

interface KpiCardProps {
  label: string;
  value: number;
  change: Change;
  dotColor: string;
}

const Card = styled.div`
  background: ${(p) => p.theme.colors.ink};
  border: 1px solid ${(p) => p.theme.colors.inkBorder};
  border-radius: ${(p) => p.theme.radii.card};
  padding: 16px 18px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  box-shadow: ${(p) => p.theme.shadows.card};
  min-width: 0;
`;

const LabelRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
`;

const Dot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
  box-shadow: 0 0 0 3px ${(p) => p.theme.colors.inkElevated};
`;

const Label = styled.span`
  font-size: 12.5px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.onDarkMuted};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Value = styled.div`
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${(p) => p.theme.colors.onDark};
  font-variant-numeric: tabular-nums;
  line-height: 1;
`;

const Badge = styled.span<{ $tone: 'positive' | 'negative' | 'neutral' }>`
  align-self: flex-start;
  font-size: 11.5px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: ${(p) => p.theme.radii.pill};
  font-variant-numeric: tabular-nums;
  background: ${(p) => {
    if (p.$tone === 'positive') return 'rgba(47, 191, 143, 0.16)';
    if (p.$tone === 'negative') return 'rgba(232, 106, 95, 0.16)';
    return 'rgba(255, 255, 255, 0.08)';
  }};
  color: ${(p) => {
    if (p.$tone === 'positive') return '#4ee0ae';
    if (p.$tone === 'negative') return '#ff9185';
    return p.theme.colors.onDarkMuted;
  }};
`;

function badgeText(change: Change): string {
  if (change.label === 'new') return '+100% · new';
  if (change.label === 'up') return `+${change.pct}%`;
  if (change.label === 'down') return `${change.pct}%`;
  return '0%';
}

function badgeTone(change: Change): 'positive' | 'negative' | 'neutral' {
  if (change.label === 'up' || change.label === 'new') return 'positive';
  if (change.label === 'down') return 'negative';
  return 'neutral';
}

export function KpiCard({ label, value, change, dotColor }: KpiCardProps) {
  return (
    <Card>
      <LabelRow>
        <Dot $color={dotColor} aria-hidden="true" />
        <Label title={label}>{label}</Label>
      </LabelRow>
      <Value>{value}</Value>
      <Badge $tone={badgeTone(change)} title="Change vs previous period">{badgeText(change)}</Badge>
    </Card>
  );
}
