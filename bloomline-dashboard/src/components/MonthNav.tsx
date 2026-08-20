// src/components/MonthNav.tsx — ‹ August 2026 › month switcher (Calendar tab
// and Bookings calendar view).
import styled from 'styled-components';
import { TbChevronLeft, TbChevronRight } from 'react-icons/tb';

interface MonthNavProps {
  label: string;
  onPrev: () => void;
  onNext: () => void;
}

const Nav = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 4px;
`;

const ArrowButton = styled.button`
  width: 30px;
  height: 30px;
  border-radius: 8px;
  border: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => p.theme.colors.surface};
  color: ${(p) => p.theme.colors.textSecondary};
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  font-size: 15px;
  transition: color 0.15s ease, border-color 0.15s ease;

  &:hover {
    color: ${(p) => p.theme.colors.accent};
    border-color: ${(p) => p.theme.colors.accent};
  }
`;

const Label = styled.span`
  font-size: 13.5px;
  font-weight: 700;
  color: ${(p) => p.theme.colors.textPrimary};
  min-width: 150px;
  text-align: center;
`;

export function MonthNav({ label, onPrev, onNext }: MonthNavProps) {
  return (
    <Nav>
      <ArrowButton type="button" onClick={onPrev} aria-label="Previous month">
        <TbChevronLeft aria-hidden="true" />
      </ArrowButton>
      <Label>{label}</Label>
      <ArrowButton type="button" onClick={onNext} aria-label="Next month">
        <TbChevronRight aria-hidden="true" />
      </ArrowButton>
    </Nav>
  );
}
