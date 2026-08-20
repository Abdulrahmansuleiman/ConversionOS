// src/tabs/HumanTransfersTab.tsx — handoffs to a human agent
// (event_type = handed_off_to_human), incl. bulk-order qualification (spec §4.1).
import { useMemo } from 'react';
import { useEvents } from '../hooks/useEvents';
import { displayName, formatDateTime } from '../utils/format';
import { Card, CardHeader, CardSub, CardTitle, Table, Td, Th, Tr } from '../components/ui';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SampleDataBadge } from '../components/SampleDataBadge';

export function HumanTransfersTab() {
  const transfers = useEvents({ eventType: 'handed_off_to_human' });
  const hasSample = useMemo(
    () => (transfers.data ?? []).some((e) => e.payload?.meta?.sample === true),
    [transfers.data],
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Human transfers</CardTitle>
          <CardSub>Leads the AI agent handed to a human — including bulk-order qualification</CardSub>
        </div>
        {hasSample ? <SampleDataBadge /> : null}
      </CardHeader>
      {transfers.error ? (
        <ErrorState message={`Failed to load human transfers: ${transfers.error}`} onRetry={transfers.retry} />
      ) : transfers.loading ? (
        <EmptyState title="Loading transfers…" />
      ) : !transfers.data || transfers.data.length === 0 ? (
        <EmptyState
          title="No human transfers yet"
          message="Waiting for the first handoff webhook from n8n/GoHighLevel."
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <Tr>
                <Th>Lead</Th>
                <Th>Reason</Th>
                <Th>Assigned to</Th>
                <Th>Handed off</Th>
              </Tr>
            </thead>
            <tbody>
              {transfers.data.map((e) => (
                <Tr key={e.id}>
                  <Td>{displayName(e.payload, e.client_id)}</Td>
                  <Td>{typeof e.payload?.reason === 'string' && e.payload.reason ? e.payload.reason : '—'}</Td>
                  <Td>
                    {typeof e.payload?.assigned_to === 'string' && e.payload.assigned_to ? e.payload.assigned_to : '—'}
                  </Td>
                  <Td>{formatDateTime(e.timestamp)}</Td>
                </Tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Card>
  );
}
