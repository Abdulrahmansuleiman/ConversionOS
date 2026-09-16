// src/components/ErrorBanner.tsx — visible error + Retry (never silent).
import { FiAlertTriangle } from 'react-icons/fi';
import styled from 'styled-components';
import { theme } from '../theme';

export function ErrorBanner({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Banner role="alert">
      <Icon />
      <Message>{message}</Message>
      {onRetry ? <Retry onClick={onRetry}>Retry</Retry> : null}
    </Banner>
  );
}

const Banner = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 14px 16px;
  border-radius: ${theme.radii.md}px;
  background: ${hexToRgba(theme.colors.negative, 0.1)};
  border: 1px solid ${hexToRgba(theme.colors.negative, 0.35)};
  color: ${theme.colors.negative};
  font-size: 14px;
  line-height: 1.45;
`;

const Icon = styled(FiAlertTriangle)`
  flex-shrink: 0;
  margin-top: 1px;
`;

const Message = styled.span`
  flex: 1;
`;

const Retry = styled.button`
  flex-shrink: 0;
  background: transparent;
  border: 1px solid ${hexToRgba(theme.colors.negative, 0.5)};
  color: ${theme.colors.negative};
  border-radius: ${theme.radii.sm}px;
  padding: 5px 12px;
  font-size: 13px;
  font-weight: 600;
  transition: background 0.15s ease;

  &:hover {
    background: ${hexToRgba(theme.colors.negative, 0.15)};
  }
`;

function hexToRgba(hex: string, alpha: number) {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}