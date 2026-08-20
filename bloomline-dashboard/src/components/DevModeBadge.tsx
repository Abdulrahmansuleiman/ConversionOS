// src/components/DevModeBadge.tsx — persistent mode badge (spec §4.5).
// Shows ONLY in local-file mode with the exact spec text; never in supabase mode.
import styled from 'styled-components';
import { TbDatabase } from 'react-icons/tb';
import { useHealth } from '../hooks/useHealth';

const Badge = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  background: ${(p) => p.theme.colors.accentSoft};
  color: ${(p) => p.theme.colors.accent};
  border: 1px solid rgba(22, 163, 74, 0.35);
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.02em;
  padding: 5px 10px;
  border-radius: ${(p) => p.theme.radii.pill};
  white-space: nowrap;
`;

export function DevModeBadge() {
  const { data, loading, error } = useHealth();
  // Fail loud: if health is unavailable we don't guess the mode — we simply
  // don't render the badge; the app itself surfaces the API error state.
  if (loading || error) return null;
  if (data?.mode !== 'local-file') return null;
  return (
    <Badge title="Events and users persist to ./data/*.json until Supabase keys are set">
      <TbDatabase aria-hidden="true" /> DEV MODE: local store — Supabase not configured
    </Badge>
  );
}
