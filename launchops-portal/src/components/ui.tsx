import styled from 'styled-components';
import { theme } from '../theme';

export function StatusBadge({ label, color }: { label: string; color: string }) {
  return (
    <Badge $color={color}>
      <Dot $color={color} />
      {label}
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
  background: ${({ $color }) => `${hexToRgba($color, 0.12)}`};
  border: 1px solid ${({ $color }) => `${hexToRgba($color, 0.28)}`};
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

export function Card({ children, onClick, as }: { children: React.ReactNode; onClick?: () => void; as?: keyof HTMLElementTagNameMap }) {
  return (
    <CardShell as={as as never} onClick={onClick}>
      {children}
    </CardShell>
  );
}

const CardShell = styled.div<{ onClick?: () => void }>`
  background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.surface2} 100%);
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.lg};
  box-shadow: ${theme.shadows.card};
  padding: 22px;
  ${({ onClick }) => onClick && 'cursor: pointer; transition: box-shadow .18s ease, transform .18s ease, border-color .18s ease;'}
  &:hover {
    ${({ onClick }) => onClick && `box-shadow: ${theme.shadows.hover}; transform: translateY(-2px); border-color: ${hexToRgba(theme.colors.accent, 0.35)};`}
  }
`;

export function ProgressBar({ value, color }: { value: number; color?: string }) {
  return (
    <Track>
      <Fill $color={color || theme.colors.accent} $value={Math.max(0, Math.min(100, value))} />
    </Track>
  );
}

const Track = styled.div`
  height: 6px;
  border-radius: 999px;
  background: #1B2740;
  overflow: hidden;
`;

const Fill = styled.div<{ $value: number; $color: string }>`
  height: 100%;
  width: ${({ $value }) => $value}%;
  border-radius: 999px;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 12px ${({ $color }) => hexToRgba($color, 0.5)};
  transition: width 0.4s ease;
`;

export function StarRating({ value, max = 5 }: { value: number | null; max?: number }) {
  if (value === null || value === undefined) return <Muted>—</Muted>;
  const stars = [1, 2, 3, 4, 5];
  // The Notion form asks for a rating out of 10; stars are always 5, so scale.
  const scaled = (Number(value) / max) * 5;
  return (
    <span style={{ display: 'inline-flex', gap: 2, alignItems: 'center' }}>
      {stars.map((s) => (
        <Star key={s} $on={s <= Math.round(scaled)}>★</Star>
      ))}
      <Muted style={{ marginLeft: 6 }}>
        {max === 5 ? Number(value).toFixed(1) : `${Number(value)}/${max}`}
      </Muted>
    </span>
  );
}

const Star = styled.span<{ $on: boolean }>`
  color: ${({ $on }) => ($on ? '#FFB43A' : '#33405C')};
  font-size: 15px;
  text-shadow: ${({ $on }) => ($on ? '0 0 8px rgba(255,180,58,0.5)' : 'none')};
`;

const Muted = styled.span`
  color: ${theme.colors.textMuted};
  font-size: 13px;
`;

export function Avatar({ name, size = 38 }: { name: string; size?: number }) {
  const initials = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join('');
  return (
    <Circle $size={size} $color={stringToColor(name)}>
      {initials || '?'}
    </Circle>
  );
}

const Circle = styled.div<{ $size: number; $color: string }>`
  width: ${({ $size }) => $size}px;
  height: ${({ $size }) => $size}px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.fonts.display};
  font-weight: 700;
  font-size: ${({ $size }) => Math.round($size * 0.4)}px;
  color: #fff;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 0 1px rgba(255,255,255,0.12) inset;
  flex-shrink: 0;
`;

function stringToColor(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  const hue = h % 360;
  return `hsl(${hue}, 45%, 38%)`;
}

export function Loading({ label = 'Loading from Notion' }: { label?: string }) {
  return (
    <LoadWrap>
      <Spinner />
      <span>{label}…</span>
    </LoadWrap>
  );
}

const LoadWrap = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 60px 0;
  color: ${theme.colors.textMuted};
  font-family: ${theme.fonts.mono};
  font-size: 13px;
`;

const Spinner = styled.div`
  width: 18px;
  height: 18px;
  border: 2px solid #33405C;
  border-top-color: ${theme.colors.accent};
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
  @keyframes spin { to { transform: rotate(360deg); } }
`;

export function EmptyState({ title, hint, action }: { title: string; hint?: string; action?: React.ReactNode }) {
  return (
    <Empty>
      <strong>{title}</strong>
      {hint && <span>{hint}</span>}
      {action}
    </Empty>
  );
}

const Empty = styled.div`
  text-align: center;
  padding: 48px 20px;
  color: ${theme.colors.textMuted};
  display: flex;
  flex-direction: column;
  gap: 8px;
  strong { color: ${theme.colors.text}; font-family: ${theme.fonts.display}; font-size: 16px; font-weight: 600; }
  span { font-size: 13px; line-height: 1.5; }
`;

export function formatDate(d: string | null) {
  if (!d) return '—';
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return d;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function daysUntil(d: string | null) {
  if (!d) return null;
  const date = new Date(d);
  if (Number.isNaN(date.getTime())) return null;
  const ms = date.getTime() - Date.now();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}