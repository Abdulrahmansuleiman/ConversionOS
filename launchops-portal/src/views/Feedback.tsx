import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
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
              <th>Project</th>
              <th>Submitted</th>
              <th>Status</th>
              <th />
            </tr>
          </thead>
          <tbody>
            {visible.map((f) => (
              <tr key={f.id}>
                <td><StarRating value={f.Rating} /></td>
                <td>
                  <FMain onClick={() => f.Project?.[0] && onOpenProject(f.Project[0])}>{f.title || 'Untitled feedback'}</FMain>
                  {f['What Went Well'] && <FSub>👍 {f['What Went Well']}</FSub>}
                  {f['What Could Improve'] && <FSub>🔧 {f['What Could Improve']}</FSub>}
                </td>
                <td>
                  <ProjCell>
                    <Avatar name={f.projectName || '?'} size={24} />
                    {f.projectName || '—'}
                  </ProjCell>
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