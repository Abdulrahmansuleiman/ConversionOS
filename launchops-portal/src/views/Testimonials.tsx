import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { FiCheck, FiRefreshCw } from 'react-icons/fi';
import { client } from '../api/client';
import { theme } from '../theme';
import { StarRating, StatusBadge, Loading, EmptyState, formatDate, Avatar } from '../components/ui';
import { Header } from '../components/Header';
import type { Testimonial } from '../types';

export function Testimonials({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const [rows, setRows] = useState<Testimonial[] | null>(null);
  const [showAll, setShowAll] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await client.get<Testimonial[]>(`/api/testimonials${showAll ? '?all=1' : ''}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [showAll]);

  useEffect(() => {
    load();
  }, [load]);

  const toggleApproved = async (t: Testimonial) => {
    await client.patch(`/api/testimonials/${t.id}`, { Approved: !t.Approved });
    load();
  };

  if (error) return <EmptyState title="Couldn't load testimonials" hint={error} />;
  if (!rows) return <Loading label="Loading testimonials" />;

  return (
    <div>
      <Header
        title="Testimonials"
        subtitle="Approved quotes shown to the world — pending ones stay private"
        eyebrow="Proof"
      />

      <TopRow>
        <Toggle $active={showAll} onClick={() => setShowAll(!showAll)}>
          <FiRefreshCw size={13} /> {showAll ? 'Showing all' : 'Showing approved only'}
        </Toggle>
      </TopRow>

      {rows.length === 0 ? (
        <EmptyState title="No testimonials yet" hint="Add one in Notion, or approve a client quote and it appears here." />
      ) : (
        <Grid>
          {rows.map((t) => (
            <Card key={t.id} $pending={!t.Approved}>
              <QuoteMark>“</QuoteMark>
              <Quote onClick={() => t.Project?.[0] && onOpenProject(t.Project[0])}>{t.title}</Quote>
              <Meta>
                <Avatar name={t.Client || t.projectName || '?'} size={32} />
                <div>
                  <ClientName>{t.Client || t.projectName || 'Client'}</ClientName>
                  <ClientSub>
                    {t.projectName || '—'}
                    {t.Date ? ` · ${formatDate(t.Date)}` : ''}
                  </ClientSub>
                </div>
              </Meta>
              <Bottom>
                <StarRating value={t.Rating} />
                {!t.Approved ? (
                  <BadgePending>Pending approval</BadgePending>
                ) : (
                  <StatusBadge label="Approved" color={theme.colors.positive} />
                )}
              </Bottom>
              <ApproveBtn $approved={t.Approved} onClick={() => toggleApproved(t)}>
                {t.Approved ? <FiRefreshCw size={13} /> : <FiCheck size={13} />}
                {t.Approved ? 'Unapprove' : 'Approve'}
              </ApproveBtn>
            </Card>
          ))}
        </Grid>
      )}
    </div>
  );
}

const TopRow = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-bottom: 16px;
`;

const Toggle = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 14px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255,180,58,0.5)' : theme.colors.border)};
  background: ${({ $active }) => ($active ? theme.colors.accentSoft : theme.colors.surface)};
  color: ${({ $active }) => ($active ? theme.colors.accent : theme.colors.textMuted)};
  border-radius: ${theme.radii.sm};
  font-size: 13px;
  font-weight: 500;
  &:hover { border-color: ${theme.colors.accent}; }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
  gap: 16px;
`;

const Card = styled.div<{ $pending: boolean }>`
  position: relative;
  background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.surface2} 100%);
  border: 1px solid ${({ $pending }) => ($pending ? 'rgba(251, 191, 36, 0.35)' : theme.colors.border)};
  border-radius: ${theme.radii.lg};
  box-shadow: ${theme.shadows.card};
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const QuoteMark = styled.div`
  font-size: 44px;
  line-height: 0.5;
  color: ${theme.colors.accent};
  opacity: 0.5;
  font-family: Georgia, serif;
  text-shadow: 0 0 18px rgba(255, 180, 58, 0.4);
`;

const Quote = styled.button`
  font-family: ${theme.fonts.display};
  font-size: 16px;
  line-height: 1.55;
  color: ${theme.colors.text};
  background: none;
  border: none;
  text-align: left;
  padding: 0;
  &:hover { color: ${theme.colors.accent}; }
`;

const Meta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ClientName = styled.div`
  font-weight: 700;
  font-size: 13.5px;
`;

const ClientSub = styled.div`
  font-size: 12.5px;
  color: ${theme.colors.textMuted};
`;

const Bottom = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const BadgePending = styled.span`
  font-size: 11px;
  font-weight: 700;
  font-family: ${theme.fonts.mono};
  letter-spacing: 0.06em;
  color: #FBBF24;
  background: rgba(251, 191, 36, 0.12);
  border: 1px solid rgba(251, 191, 36, 0.3);
  padding: 4px 9px;
  border-radius: 999px;
  text-transform: uppercase;
`;

const ApproveBtn = styled.button<{ $approved: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  align-self: flex-start;
  padding: 7px 13px;
  border: 1px solid ${({ $approved }) => ($approved ? 'rgba(52,211,153,0.4)' : theme.colors.border)};
  background: ${({ $approved }) => ($approved ? 'rgba(52,211,153,0.1)' : theme.colors.surface2)};
  color: ${({ $approved }) => ($approved ? theme.colors.positive : theme.colors.textMuted)};
  border-radius: ${theme.radii.sm};
  font-size: 12.5px;
  font-weight: 600;
  &:hover { border-color: ${theme.colors.accent}; color: ${theme.colors.accent}; }
`;