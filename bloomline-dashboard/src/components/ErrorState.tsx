// src/components/ErrorState.tsx — standard error component (spec §5.3).
// Fail loud: show the actual error message + Retry. Never zeros, never mocks.
import styled from 'styled-components';
import { TbAlertTriangle, TbRefresh } from 'react-icons/tb';

interface ErrorStateProps {
  message: string;
  onRetry?: () => void;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 8px;
  padding: 40px 24px;
  color: ${(p) => p.theme.colors.textSecondary};

  svg {
    font-size: 30px;
    color: ${(p) => p.theme.colors.negative};
  }
`;

const Message = styled.div`
  font-size: 13px;
  line-height: 1.5;
  max-width: 420px;
  color: ${(p) => p.theme.colors.textPrimary};
`;

const RetryButton = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  border: none;
  background: ${(p) => p.theme.colors.accent};
  color: #fff;
  font-weight: 600;
  font-size: 13px;
  padding: 8px 16px;
  border-radius: ${(p) => p.theme.radii.button};
  cursor: pointer;
  transition: background 0.15s ease;

  &:hover {
    background: ${(p) => p.theme.colors.accentHover};
  }
`;

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <Wrapper>
      <TbAlertTriangle aria-hidden="true" />
      <Message>{message}</Message>
      {onRetry ? (
        <RetryButton type="button" onClick={onRetry}>
          <TbRefresh aria-hidden="true" /> Retry
        </RetryButton>
      ) : null}
    </Wrapper>
  );
}
