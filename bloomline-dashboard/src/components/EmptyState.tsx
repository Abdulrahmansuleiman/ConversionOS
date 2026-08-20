// src/components/EmptyState.tsx — standard empty state (spec §5.2.3).
// Empty is a legitimate state; never pad it with sample or invented rows.
import type { ReactNode } from 'react';
import styled from 'styled-components';
import { TbInbox } from 'react-icons/tb';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  message?: string;
  hint?: string;
}

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  gap: 6px;
  padding: 40px 24px;
  color: ${(p) => p.theme.colors.textSecondary};

  svg.emptystate-icon {
    font-size: 30px;
    color: ${(p) => p.theme.colors.textMuted};
    margin-bottom: 4px;
  }
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 14px;
  color: ${(p) => p.theme.colors.textPrimary};
`;

const Message = styled.div`
  font-size: 13px;
  color: ${(p) => p.theme.colors.textSecondary};
  max-width: 380px;
  line-height: 1.5;
`;

const Hint = styled.div`
  font-size: 12px;
  color: ${(p) => p.theme.colors.textMuted};
`;

export function EmptyState({ icon, title, message, hint }: EmptyStateProps) {
  return (
    <Wrapper>
      {icon ?? <TbInbox className="emptystate-icon" />}
      <Title>{title}</Title>
      {message ? <Message>{message}</Message> : null}
      {hint ? <Hint>{hint}</Hint> : null}
    </Wrapper>
  );
}
