// src/components/ErrorBoundary.tsx — per-tab error boundary (spec §5.3):
// one broken tab must never blank the whole app.
import { Component, type ErrorInfo, type ReactNode } from 'react';
import styled from 'styled-components';
import { TbAlertTriangle } from 'react-icons/tb';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

const Fallback = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  padding: 48px 24px;
  text-align: center;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.card};

  svg {
    font-size: 32px;
    color: ${(p) => p.theme.colors.negative};
  }
`;

const Title = styled.div`
  font-weight: 600;
  font-size: 14px;
`;

const Detail = styled.div`
  font-size: 12.5px;
  color: ${(p) => p.theme.colors.textSecondary};
  max-width: 460px;
  line-height: 1.5;
  font-family: ui-monospace, 'Cascadia Mono', Consolas, monospace;
`;

const ReloadButton = styled.button`
  border: none;
  background: transparent;
  color: ${(p) => p.theme.colors.accent};
  font-weight: 600;
  cursor: pointer;
  font-size: 13px;
  &:hover {
    text-decoration: underline;
  }
`;

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    // Fail loud — the error is logged, never swallowed.
    console.error('[tab error boundary]', error, info.componentStack);
  }

  render(): ReactNode {
    if (this.state.error) {
      return (
        <Fallback role="alert">
          <TbAlertTriangle aria-hidden="true" />
          <Title>This section failed to render</Title>
          <Detail>{this.state.error.message}</Detail>
          <ReloadButton type="button" onClick={() => window.location.reload()}>
            Reload dashboard
          </ReloadButton>
        </Fallback>
      );
    }
    return this.props.children;
  }
}
