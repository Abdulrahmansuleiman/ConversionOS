// src/pages/StatusPage.tsx — client status page (§4.3).
// 404 → friendly card + CTA; network/5xx → ErrorBanner + Retry.
// No fabricated fallback content, ever (§6.3).
import { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import styled from 'styled-components';
import { Card } from '../components/Card';
import { ErrorBanner } from '../components/ErrorBanner';
import { Logo } from '../components/Logo';
import { StatusBadge } from '../components/StatusBadge';
import { copy } from '../content/copy';
import { apiFetch } from '../lib/api';
import { phaseStatusColor, theme } from '../theme';

type Milestone = {
  id: string;
  milestone: string;
  phase: string;
  status: string;
};

type StatusResponse = {
  ok: true;
  project: {
    id: string;
    client: string;
    status: string | null;
    industry: string | null;
    aiPersona: string | null;
    notes: string | null;
    createdAt: string | null;
  };
  milestones: Milestone[];
};

type LoadState = 'loading' | 'success' | 'notfound' | 'error';

export default function StatusPage() {
  const { clientSlug } = useParams<{ clientSlug: string }>();
  const [state, setState] = useState<LoadState>('loading');
  const [data, setData] = useState<StatusResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setState('loading');
    setErrorMessage(null);
    try {
      const res = await apiFetch<StatusResponse>(`/api/status/${clientSlug}`);
      setData(res);
      setState('success');
    } catch (e) {
      if (e instanceof Error && 'status' in e && (e as { status: number }).status === 404) {
        setState('notfound');
      } else {
        setErrorMessage(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
        setState('error');
      }
    }
  }, [clientSlug]);

  useEffect(() => {
    void load();
  }, [load]);

  return (
    <Shell>
      <Header>
        <Logo suffix="Client" />
      </Header>
      <Center>
        {state === 'loading' && <Loading>Loading your onboarding…</Loading>}

        {state === 'notfound' && (
          <Card>
            <NotFoundTitle>{copy.status.notFoundTitle}</NotFoundTitle>
            <NotFoundBody>
              It may not have been created yet, or this link may be wrong.
            </NotFoundBody>
            <Link to="/onboard">
              <StartCTA>{copy.status.startOnboarding}</StartCTA>
            </Link>
          </Card>
        )}

        {state === 'error' && errorMessage && (
          <Card>
            <ErrorBanner message={errorMessage} onRetry={() => void load()} />
          </Card>
        )}

        {state === 'success' && data && (
          <Card>
            <Welcome>Welcome, {data.project.client} 👋</Welcome>
            <JourneyTitle>{copy.status.journey}</JourneyTitle>
            <Timeline>
              {data.milestones.map((m, i) => (
                <Row key={m.id}>
                  <Rail>
                    {i > 0 ? <Segment $active={data.milestones[i - 1]?.status === 'Complete'} /> : <SegmentSpace />}
                    <Dot $color={phaseStatusColor[m.status] ?? theme.colors.textFaint} />
                    {i < data.milestones.length - 1 ? (
                      <Segment $active={m.status === 'Complete'} />
                    ) : (
                      <SegmentSpace />
                    )}
                  </Rail>
                  <RowBody>
                    <PhaseName>{m.milestone}</PhaseName>
                    <StatusBadge status={m.status} />
                  </RowBody>
                </Row>
              ))}
            </Timeline>
            <Next>
              <NextTitle>{copy.status.whatYouGetNext}</NextTitle>
              <NextList>
                {copy.status.nextItems.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </NextList>
            </Next>
          </Card>
        )}
      </Center>
    </Shell>
  );
}

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding-bottom: 48px;
`;

const Header = styled.header`
  width: 100%;
  max-width: 1080px;
  padding: 26px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Center = styled.main`
  width: 100%;
  max-width: 560px;
  padding: 0 20px;
`;

const Loading = styled.p`
  text-align: center;
  color: ${theme.colors.textMuted};
  padding: 48px 0;
`;

const NotFoundTitle = styled.h2`
  font-family: ${theme.fonts.display};
  font-size: 24px;
  font-weight: 600;
  color: ${theme.colors.text};
`;

const NotFoundBody = styled.p`
  margin-top: 10px;
  font-size: 15px;
  line-height: 1.55;
  color: ${theme.colors.textMuted};
`;

const StartCTA = styled.span`
  display: inline-flex;
  margin-top: 22px;
  padding: 12px 22px;
  border-radius: ${theme.radii.md}px;
  background: ${theme.colors.accent};
  color: #fff;
  font-family: ${theme.fonts.display};
  font-size: 15px;
  font-weight: 700;
  transition: box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    box-shadow: ${theme.shadows.hover};
    transform: translateY(-1px);
  }
`;

const Welcome = styled.h1`
  font-family: ${theme.fonts.display};
  font-size: 26px;
  font-weight: 700;
  color: ${theme.colors.text};
`;

const JourneyTitle = styled.h2`
  margin-top: 6px;
  font-family: ${theme.fonts.display};
  font-size: 16px;
  font-weight: 600;
  color: ${theme.colors.textMuted};
`;

const Timeline = styled.div`
  margin-top: 26px;
  display: flex;
  flex-direction: column;
  gap: 0;
`;

const Row = styled.div`
  display: flex;
  gap: 16px;
`;

const Rail = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 14px;
`;

const Segment = styled.div<{ $active: boolean }>`
  width: 2px;
  flex: 1;
  min-height: 22px;
  background: ${({ $active }) => ($active ? theme.colors.accent : theme.colors.border)};
`;

const SegmentSpace = styled.div`
  flex: 1;
  min-height: 22px;
`;

const Dot = styled.span<{ $color: string }>`
  width: 12px;
  height: 12px;
  border-radius: 50%;
  background: ${({ $color }) => $color};
  box-shadow: 0 0 8px ${({ $color }) => $color};
  flex-shrink: 0;
`;

const RowBody = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex: 1;
  padding: 12px 0;
  border-bottom: 1px solid ${theme.colors.borderSoft};

  &:last-child {
    border-bottom: none;
  }
`;

const PhaseName = styled.span`
  font-family: ${theme.fonts.display};
  font-size: 15px;
  font-weight: 600;
  color: ${theme.colors.text};
`;

const Next = styled.div`
  margin-top: 28px;
  padding-top: 20px;
  border-top: 1px solid ${theme.colors.borderSoft};
`;

const NextTitle = styled.h3`
  font-family: ${theme.fonts.display};
  font-size: 15px;
  font-weight: 600;
  color: ${theme.colors.text};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const NextList = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
  font-size: 14.5px;
  color: ${theme.colors.textMuted};

  li::before {
    content: '→ ';
    color: ${theme.colors.accent};
  }
`;