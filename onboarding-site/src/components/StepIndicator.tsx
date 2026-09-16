// src/components/StepIndicator.tsx — wizard progress (4 labeled steps).
import styled from 'styled-components';
import { theme } from '../theme';

type StepState = 'done' | 'current' | 'upcoming';

export function StepIndicator({ steps, current }: { steps: readonly string[]; current: number }) {
  return (
    <Row>
      {steps.map((label, i) => {
        const n = i + 1;
        const state: StepState = n < current ? 'done' : n === current ? 'current' : 'upcoming';
        return (
          <Step key={label} $state={state}>
            <Num $state={state}>{state === 'done' ? '✓' : n}</Num>
            <LabelText $state={state}>{label}</LabelText>
          </Step>
        );
      })}
    </Row>
  );
}

const Row = styled.ol`
  list-style: none;
  display: flex;
  align-items: flex-start;
  gap: 0;
  margin: 0;
  padding: 0;
`;

const Step = styled.li<{ $state: StepState }>`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  flex: 1;
  position: relative;

  & + &::before {
    content: '';
    position: absolute;
    top: 15px;
    left: -50%;
    width: 100%;
    height: 2px;
    background: ${({ $state }) =>
      $state === 'upcoming' ? theme.colors.border : theme.colors.accent};
    z-index: 0;
  }
`;

const Num = styled.span<{ $state: StepState }>`
  position: relative;
  z-index: 1;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.fonts.display};
  font-size: 13px;
  font-weight: 600;
  background: ${({ $state }) =>
    $state === 'upcoming' ? theme.colors.surface2 : theme.colors.accent};
  color: ${({ $state }) => ($state === 'upcoming' ? theme.colors.textFaint : '#FFFFFF')};
  border: 1px solid
    ${({ $state }) => ($state === 'upcoming' ? theme.colors.border : theme.colors.accent)};
  box-shadow: ${({ $state }) => ($state === 'current' ? theme.shadows.glow : 'none')};
`;

const LabelText = styled.span<{ $state: StepState }>`
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${({ $state }) =>
    $state === 'upcoming' ? theme.colors.textFaint : $state === 'current' ? theme.colors.accent : theme.colors.textMuted};
  white-space: nowrap;
`;