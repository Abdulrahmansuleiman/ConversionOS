// src/components/TimeframeToggle.tsx — Today / This Week / Last Week /
// Last Month / Last 2 Months (spec §1.2/§4.7, §5.4 exact labels).
import styled from 'styled-components';
import type { Timeframe } from '../types/events';

export const TIMEFRAME_OPTIONS: { value: Timeframe; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'this_week', label: 'This Week' },
  { value: 'last_week', label: 'Last Week' },
  { value: 'last_month', label: 'Last Month' },
  { value: 'last_2_months', label: 'Last 2 Months' },
];

const Toggle = styled.div`
  display: inline-flex;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.button};
  padding: 3px;
  gap: 2px;
  overflow-x: auto;
`;

const Option = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(p) => (p.$active ? p.theme.colors.accent : 'transparent')};
  color: ${(p) => (p.$active ? '#ffffff' : p.theme.colors.textSecondary)};
  font-size: 12px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 7px;
  cursor: pointer;
  white-space: nowrap;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover {
    color: ${(p) => (p.$active ? '#ffffff' : p.theme.colors.textPrimary)};
  }
`;

interface TimeframeToggleProps {
  value: Timeframe;
  onChange: (t: Timeframe) => void;
}

export function TimeframeToggle({ value, onChange }: TimeframeToggleProps) {
  return (
    <Toggle role="tablist" aria-label="Timeframe">
      {TIMEFRAME_OPTIONS.map((opt) => (
        <Option
          key={opt.value}
          role="tab"
          aria-selected={value === opt.value}
          $active={value === opt.value}
          onClick={() => onChange(opt.value)}
        >
          {opt.label}
        </Option>
      ))}
    </Toggle>
  );
}
