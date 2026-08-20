// src/components/ui.tsx — shared card + table primitives (spec §3.3 table styling).
import styled from 'styled-components';
import { theme as channelRef } from '../theme';

export const Card = styled.div`
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.card};
  box-shadow: ${(p) => p.theme.shadows.card};
  overflow: hidden;
`;

export const CardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 15px 20px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
`;

export const CardTitle = styled.div`
  font-size: 14.5px;
  font-weight: 700;
  color: ${(p) => p.theme.colors.textPrimary};
`;

export const CardSub = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

export const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
`;

export const Th = styled.th`
  text-align: left;
  padding: 10px 18px;
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: ${(p) => p.theme.colors.textMuted};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  white-space: nowrap;
`;

export const Td = styled.td`
  padding: 12px 18px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  color: ${(p) => p.theme.colors.textPrimary};
  vertical-align: middle;
`;

export const Tr = styled.tr`
  &:last-child td {
    border-bottom: none;
  }
  &:hover td {
    background: ${(p) => p.theme.colors.bg};
  }
`;

type Tone = 'positive' | 'warning' | 'accent' | 'neutral';

const TONE_COLORS: Record<Tone, { bg: string; fg: string }> = {
  positive: { bg: 'rgba(47, 191, 143, 0.14)', fg: '#17805c' },
  warning: { bg: 'rgba(245, 165, 36, 0.16)', fg: '#9a6100' },
  accent: { bg: 'rgba(22, 163, 74, 0.14)', fg: '#0d7a36' },
  neutral: { bg: 'rgba(111, 104, 120, 0.12)', fg: '#6f6878' },
};

export const Pill = styled.span<{ $tone: Tone }>`
  display: inline-block;
  padding: 3px 10px;
  border-radius: ${(p) => p.theme.radii.pill};
  font-size: 11.5px;
  font-weight: 700;
  background: ${(p) => TONE_COLORS[p.$tone].bg};
  color: ${(p) => TONE_COLORS[p.$tone].fg};
  white-space: nowrap;
`;

/** Status -> tone mapping (§4.2 status values + unknown). */
export function statusTone(status: string | undefined | null): Tone {
  switch ((status ?? '').toLowerCase()) {
    case 'completed':
    case 'resolved':
      return 'positive';
    case 'open':
      return 'warning';
    case 'scheduled':
    case 'handed_off':
      return 'accent';
    default:
      return 'neutral';
  }
}

export function StatusPill({ status }: { status: string | undefined | null }) {
  return <Pill $tone={statusTone(status)}>{status || '—'}</Pill>;
}

/** Channel dot + label (theme.colors.channels, unknown -> em dash per §5.2.2). */
function channelColor(channel: string): string {
  const channels = channelRef.colors.channels;
  const c = channels[channel.toLowerCase() as keyof typeof channels];
  return c ?? channels.other;
}

export function ChannelPill({ channel }: { channel: string | undefined | null }) {
  if (!channel || channel.trim() === '') {
    return <Pill $tone="neutral">—</Pill>;
  }
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: channelColor(channel),
          flexShrink: 0,
        }}
        aria-hidden="true"
      />
      {channel}
    </span>
  );
}

export const EmptyCell = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
`;
