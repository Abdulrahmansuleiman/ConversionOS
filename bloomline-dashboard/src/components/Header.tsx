// src/components/Header.tsx — dashboard title, client context, current date,
// notification bell (NO search bar, spec §1.2), plus the dev-mode badge (§4.5).
import styled from 'styled-components';
import { TbBell } from 'react-icons/tb';
import { DevModeBadge } from './DevModeBadge';

const Bar = styled.header`
  display: flex;
  align-items: center;
  gap: 16px;
  padding: 4px 0 18px;
`;

const Titles = styled.div`
  display: flex;
  flex-direction: column;
  gap: 2px;
  min-width: 0;
`;

const Title = styled.h1`
  margin: 0;
  font-size: 21px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: ${(p) => p.theme.colors.textPrimary};
`;

const Subtitle = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textSecondary};
`;

const Right = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 14px;
`;

const DateLabel = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textSecondary};
  font-variant-numeric: tabular-nums;
`;

const BellButton = styled.button`
  position: relative;
  width: 38px;
  height: 38px;
  border-radius: 50%;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surface};
  color: ${(p) => p.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 17px;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: ${(p) => p.theme.colors.accent};
    border-color: ${(p) => p.theme.colors.accent};
  }

  &::after {
    content: '';
    position: absolute;
    top: 9px;
    right: 10px;
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${(p) => p.theme.colors.accent};
    border: 2px solid ${(p) => p.theme.colors.surface};
  }
`;

export function Header() {
  const today = new Date();
  const dateLabel = new Intl.DateTimeFormat(undefined, {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(today);

  return (
    <Bar>
      <Titles>
        <Title>Agent Report</Title>
        <Subtitle>Bloomline Apparel — what your AI agent did for you</Subtitle>
      </Titles>
      <Right>
        <DevModeBadge />
        <DateLabel>{dateLabel}</DateLabel>
        <BellButton type="button" aria-label="Notifications">
          <TbBell aria-hidden="true" />
        </BellButton>
      </Right>
    </Bar>
  );
}
