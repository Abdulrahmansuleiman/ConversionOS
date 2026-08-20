// src/components/SampleDataBadge.tsx — "SAMPLE DATA" label (spec §5.2.4).
// Shown whenever any visible event carries payload.meta.sample = true.
// Only `npm run seed` may produce such events.
import styled from 'styled-components';
import { TbFlask } from 'react-icons/tb';

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  background: ${(p) => p.theme.colors.warning};
  color: #3a2500;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  padding: 4px 10px;
  border-radius: ${(p) => p.theme.radii.pill};
`;

export function SampleDataBadge() {
  return (
    <Badge title="These rows were created by `npm run seed` and are labeled sample data, not live webhook traffic">
      <TbFlask aria-hidden="true" /> SAMPLE DATA
    </Badge>
  );
}
