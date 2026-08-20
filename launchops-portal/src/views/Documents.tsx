import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { FiDownload, FiExternalLink } from 'react-icons/fi';
import { client } from '../api/client';
import { theme } from '../theme';
import { StatusBadge, Loading, EmptyState, formatDate } from '../components/ui';
import { Header } from '../components/Header';
import type { Document } from '../types';

export function Documents({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const [rows, setRows] = useState<Document[] | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setRows(await client.get<Document[]>('/api/documents'));
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <EmptyState title="Couldn't load documents" hint={error} />;
  if (!rows) return <Loading label="Loading documents" />;

  return (
    <div>
      <Header
        title="Documents"
        subtitle="Proposals, contracts, invoices and receipts — one record per client, stored in Notion"
        eyebrow="Paperwork"
      />

      {rows.length === 0 ? (
        <EmptyState title="No documents yet" hint="Upload a document for a client and it appears here." />
      ) : (
        <Table>
          <Head>
            <Th>Document</Th>
            <Th>Client</Th>
            <Th>Type</Th>
            <Th>Date</Th>
            <Th>Amount</Th>
            <Th>Status</Th>
            <Th>File</Th>
          </Head>
          {rows.map((d) => (
            <Row key={d.id}>
              <Td>
                <DocName onClick={() => d.Client?.[0] && onOpenProject(d.Client[0])}>{d.title}</DocName>
                {d.Notes ? <Notes>{d.Notes}</Notes> : null}
              </Td>
              <Td>
                <Client onClick={() => d.Client?.[0] && onOpenProject(d.Client[0])}>
                  {d.projectName || d.Client?.[0] || '—'}
                </Client>
              </Td>
              <Td>
                <TypeTag>{d['Document Type'] || '—'}</TypeTag>
              </Td>
              <Td>{formatDate(d['Document Date'])}</Td>
              <Td>
                {typeof d.Amount === 'number'
                  ? d.Amount.toLocaleString('en-US', { style: 'currency', currency: 'USD' })
                  : '—'}
                {d['Paid Date'] && (
                  <PaidLine>paid {formatDate(d['Paid Date'])}{d['Payment Method'] ? ` · ${d['Payment Method']}` : ''}</PaidLine>
                )}
              </Td>
              <Td>
                <StatusBadge label={d.Status || '—'} color={statusColor(d.Status)} />
              </Td>
              <Td>
                {d.file?.url ? (
                  <DownloadLink href={d.file.url} target="_blank" rel="noopener noreferrer" title={d.file.name || 'Open file'}>
                    {d.file.name ? <span>{d.file.name}</span> : null}
                    {d.file.type === 'file' ? <FiDownload size={15} /> : <FiExternalLink size={15} />}
                  </DownloadLink>
                ) : (
                  <span style={{ color: theme.colors.textFaint }}>—</span>
                )}
              </Td>
            </Row>
          ))}
        </Table>
      )}
    </div>
  );
}

function statusColor(status: string | null): string {
  if (!status) return theme.colors.textMuted;
  const s = status.toLowerCase();
  if (s.includes('paid') || s === 'signed') return theme.colors.positive;
  if (s.includes('sent') || s.includes('issued') || s.includes('pending')) return theme.colors.accent;
  if (s.includes('draft') || s.includes('void') || s.includes('cancelled') || s.includes('overdue')) return theme.colors.negative;
  return theme.colors.textMuted;
}

const Table = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.lg};
  overflow: hidden;
  background: ${theme.colors.surface};
  box-shadow: ${theme.shadows.card};
`;

const Head = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 2fr) minmax(130px, 1fr) 110px 100px 120px 110px 120px;
  gap: 12px;
  padding: 12px 18px;
  background: ${theme.colors.surface2};
  border-bottom: 1px solid ${theme.colors.border};
`;

const Th = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: ${theme.colors.textFaint};
`;

const Row = styled.div`
  display: grid;
  grid-template-columns: minmax(180px, 2fr) minmax(130px, 1fr) 110px 100px 120px 110px 120px;
  gap: 12px;
  align-items: center;
  padding: 13px 18px;
  border-bottom: 1px solid ${theme.colors.borderSoft};
  &:last-child { border-bottom: none; }
  &:hover { background: rgba(255, 180, 58, 0.03); }
`;

const Td = styled.div`
  font-size: 13.5px;
  color: ${theme.colors.text};
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const DocName = styled.button`
  display: block;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  text-align: left;
  font-family: ${theme.fonts.display};
  font-weight: 600;
  font-size: 14px;
  color: ${theme.colors.text};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  &:hover { color: ${theme.colors.accent}; }
`;

const Notes = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin-top: 2px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const Client = styled.button`
  background: none;
  border: none;
  padding: 0;
  font-size: 13.5px;
  color: ${theme.colors.textMuted};
  &:hover { color: ${theme.colors.accent}; }
`;

const TypeTag = styled.span`
  display: inline-block;
  font-size: 11.5px;
  font-weight: 600;
  padding: 3px 9px;
  border-radius: 999px;
  color: ${theme.colors.accent};
  background: ${theme.colors.accentSoft};
`;

const PaidLine = styled.div`
  font-size: 11.5px;
  color: ${theme.colors.positive};
  margin-top: 2px;
`;

const DownloadLink = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  color: ${theme.colors.textMuted};
  font-size: 12.5px;
  text-decoration: none;
  max-width: 100%;
  overflow: hidden;
  span {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  &:hover { color: ${theme.colors.accent}; }
`;