import { useEffect, useState, useCallback } from 'react';
import styled, { css } from 'styled-components';
import { FiCheck } from 'react-icons/fi';
import { client } from '../api/client';
import { theme } from '../theme';
import { StarRating, StatusBadge, Loading, EmptyState, formatDate, Avatar } from '../components/ui';
import { Header } from '../components/Header';
import type { Feedback } from '../types';

const FILTERS = ['All', 'New', 'Reviewed', 'Archived'] as const;

export function Feedback({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const [rows, setRows] = useState<Feedback[] | null>(null);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('All');
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await client.get<Feedback[]>('/api/feedback'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markReviewed = async (id: string) => {
    await client.patch(`/api/feedback/${id}`, { Status: 'Reviewed' });
    load();
  };

  if (error) return <EmptyState title="Couldn't load feedback" hint={error} />;
  if (!rows) return <Loading label="Loading feedback" />;

  const visible = filter === 'All' ? rows : rows.filter((r) => (r.Status || 'New') === filter);
  const pending = rows.filter((r) => (r.Status || 'New') === 'New').length;

  return (
    <div>
      <Header
        title="Client feedback"
        subtitle={`${rows.length} submission${rows.length === 1 ? '' : 's'} · ${pending} new`}
        eyebrow="Signal"
      />

      <Filters>
        {FILTERS.map((f) => (
          <FilterBtn key={f} $active={filter === f} onClick={() => setFilter(f)}>
            {f}
            {f !== 'All' && <Count>{f === 'New' ? pending : rows.filter((r) => (r.Status || 'New') === f).length}</Count>}
          </FilterBtn>
        ))}
      </Filters>

      {visible.length === 0 ? (
        <EmptyState title="Nothing here" hint="Feedback from client Notion forms shows up in this list." />
      ) : (
        <Table>
          <thead>
            <tr>
              <th>Rating</th>
              <th>Feedback</th>
              <th>Client</th>
              <th>Project</th>
              <th>Submitted</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((f) => (
              <tr key={f.id}>
                <td><StarRating value={f.Rating} max={10} /></td>
                <td>
                  <FMain onClick={() => f.projectId && onOpenProject(f.projectId)}>{f.title || 'Untitled feedback'}</FMain>
                  {f['What Went Well'] && <FSub>👍 {f['What Went Well']}</FSub>}
                  {f['What Could Improve'] && <FSub>🔧 {f['What Could Improve']}</FSub>}
                  {f['Biggest Result So Far'] && <FSub>⭐ {f['Biggest Result So Far']}</FSub>}
                  {(f['Would Recommend'] || f.Video?.url) && (
                    <FBadges>
                      {f['Would Recommend'] && <MiniBadge $tone="good">Recommends</MiniBadge>}
                      {f.Video?.url && (
                        <MiniBadgeLink href={f.Video.url} target="_blank" rel="noreferrer" $tone="info" onClick={(e) => e.stopPropagation()}>
                          ▶ Video
                        </MiniBadgeLink>
                      )}
                    </FBadges>
                  )}
                </td>
                <td>
                  <ProjCell>
                    <Avatar name={f.FullName || f.BusinessName || f.title} size={24} />
                    <NameStack>
                      <span>{f.FullName || f.BusinessName || '—'}</span>
                      {f.FullName && f.BusinessName && <BizName>{f.BusinessName}</BizName>}
                    </NameStack>
                  </ProjCell>
                </td>
                <td>
                  {f.projectName ? (
                    <ProjName onClick={() => f.projectId && onOpenProject(f.projectId)}>{f.projectName}</ProjName>
                  ) : (
                    <MutedCell title="No Project relation and no Business Name on this submission">—</MutedCell>
                  )}
                </td>
                <td>{formatDate(f.Submitted)}</td>
                <td>
                  <StatusBadge
                    label={f.Status || 'New'}
                    color={f.Status === 'Reviewed' ? theme.colors.positive : f.Status === 'Archived' ? '#5B6787' : theme.colors.accent}
                  />
                </td>
                <td>
                  {f.Status !== 'Reviewed' && (
                    <ReviewBtn onClick={() => markReviewed(f.id)}>
                      <FiCheck size={14} /> Reviewed
                    </ReviewBtn>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </div>
  );
}

const Filters = styled.div`
  display: flex;
  gap: 8px;
  margin-bottom: 16px;
`;

const FilterBtn = styled.button<{ $active: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 7px 14px;
  border: 1px solid ${({ $active }) => ($active ? 'rgba(255,180,58,0.5)' : theme.colors.border)};
  background: ${({ $active }) => ($active ? theme.colors.accentSoft : theme.colors.surface)};
  color: ${({ $active }) => ($active ? theme.colors.accent : theme.colors.textMuted)};
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  &:hover { border-color: ${theme.colors.accent}; }
`;

const Count = styled.span`
  font-family: ${theme.fonts.mono};
  font-size: 10.5px;
  background: rgba(255,255,255,0.08);
  border-radius: 999px;
  padding: 1px 6px;
`;

const Table = styled.table`
  width: 100%;
  border-collapse: collapse;
  background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.surface2} 100%);
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.lg};
  overflow: hidden;
  box-shadow: ${theme.shadows.card};
  th {
    text-align: left;
    font-family: ${theme.fonts.mono};
    font-size: 10.5px;
    text-transform: uppercase;
    letter-spacing: 0.1em;
    color: ${theme.colors.textMuted};
    padding: 13px 16px;
    border-bottom: 1px solid ${theme.colors.border};
    background: #0D1522;
  }
  td {
    padding: 13px 16px;
    border-bottom: 1px solid ${theme.colors.borderSoft};
    font-size: 13.5px;
    vertical-align: top;
  }
  tr:last-child td { border-bottom: none; }
  tr:hover td { background: rgba(255, 180, 58, 0.03); }
`;

const FMain = styled.button`
  font-weight: 600;
  font-size: 13.5px;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  color: ${theme.colors.text};
  &:hover { color: ${theme.colors.accent}; }
`;

const FSub = styled.div`
  font-size: 12.5px;
  color: ${theme.colors.textMuted};
  margin-top: 3px;
  max-width: 340px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProjCell = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 600;
`;

const NameStack = styled.span`
  display: flex;
  flex-direction: column;
  line-height: 1.35;
  span:first-child { font-weight: 600; }
`;

const BizName = styled.span`
  font-size: 11.5px;
  color: ${theme.colors.textMuted};
  font-weight: 500;
`;

const ProjName = styled.button`
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  font-size: 13.5px;
  font-weight: 600;
  color: ${theme.colors.text};
  &:hover { color: ${theme.colors.accent}; }
`;

const MutedCell = styled.span`
  color: ${theme.colors.textFaint};
`;

const FBadges = styled.div`
  display: flex;
  gap: 6px;
  margin-top: 6px;
`;

const badgeBase = css<{ $tone: 'good' | 'info' }>`
  display: inline-flex;
  align-items: center;
  gap: 4px;
  padding: 2px 8px;
  border-radius: 999px;
  font-family: ${theme.fonts.mono};
  font-size: 9.5px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-decoration: none;
  white-space: nowrap;
  color: ${({ $tone }) => ($tone === 'good' ? theme.colors.positive : '#4CC9F0')};
  background: ${({ $tone }) => ($tone === 'good' ? 'rgba(52,211,153,0.12)' : 'rgba(76,201,240,0.12)')};
  border: 1px solid ${({ $tone }) => ($tone === 'good' ? 'rgba(52,211,153,0.28)' : 'rgba(76,201,240,0.28)')};
`;

const MiniBadge = styled.span<{ $tone: 'good' | 'info' }>`${badgeBase}`;
const MiniBadgeLink = styled.a<{ $tone: 'good' | 'info' }>`${badgeBase}`;

const ReviewBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 6px 11px;
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.surface2};
  border-radius: ${theme.radii.sm};
  font-size: 12.5px;
  font-weight: 600;
  color: ${theme.colors.text};
  &:hover { border-color: ${theme.colors.positive}; color: ${theme.colors.positive}; }
`;