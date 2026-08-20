// src/tabs/FollowUpsTab.tsx — outstanding / triggered follow-ups
// (event_type = follow_up_triggered), newest first (spec §4.1/§4.8).
import { useMemo } from 'react';
import { useEvents } from '../hooks/useEvents';
import { displayName, formatDateTime, formatDate } from '../utils/format';
import { Card, CardHeader, CardSub, CardTitle, ChannelPill, StatusPill, Table, Td, Th, Tr } from '../components/ui';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SampleDataBadge } from '../components/SampleDataBadge';

export function FollowUpsTab() {
  const followUps = useEvents({ eventType: 'follow_up_triggered' });
  const hasSample = useMemo(
    () => (followUps.data ?? []).some((e) => e.payload?.meta?.sample === true),
    [followUps.data],
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Follow-ups</CardTitle>
          <CardSub>Follow-up sequences triggered by the AI agent (e.g. abandoned cart)</CardSub>
        </div>
        {hasSample ? <SampleDataBadge /> : null}
      </CardHeader>
      {followUps.error ? (
        <ErrorState message={`Failed to load follow-ups: ${followUps.error}`} onRetry={followUps.retry} />
      ) : followUps.loading ? (
        <EmptyState title="Loading follow-ups…" />
      ) : !followUps.data || followUps.data.length === 0 ? (
        <EmptyState
          title="No follow-ups yet"
          message="Waiting for the first follow-up webhook from n8n/GoHighLevel."
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <Tr>
                <Th>Lead</Th>
                <Th>Channel</Th>
                <Th>Due</Th>
                <Th>Status</Th>
                <Th>Triggered</Th>
              </Tr>
            </thead>
            <tbody>
              {followUps.data.map((e) => (
                <Tr key={e.id}>
                  <Td>{displayName(e.payload, e.client_id)}</Td>
                  <Td>
                    <ChannelPill channel={e.payload?.channel} />
                  </Td>
                  <Td>
                    {typeof e.payload?.due_at === 'string' && e.payload.due_at ? formatDate(e.payload.due_at) : '—'}
                  </Td>
                  <Td>
                    <StatusPill status={e.payload?.status} />
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
