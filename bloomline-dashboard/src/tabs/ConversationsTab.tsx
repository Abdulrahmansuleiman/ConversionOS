// src/tabs/ConversationsTab.tsx — conversations handled by the AI agent
// (event_type = conversation_started), newest first (spec §4.1/§4.8).
import { useMemo } from 'react';
import { useEvents } from '../hooks/useEvents';
import { displayName, formatDateTime } from '../utils/format';
import { Card, CardHeader, CardSub, CardTitle, ChannelPill, StatusPill, Table, Td, Th, Tr } from '../components/ui';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SampleDataBadge } from '../components/SampleDataBadge';

export function ConversationsTab() {
  const conversations = useEvents({ eventType: 'conversation_started' });
  const hasSample = useMemo(
    () => (conversations.data ?? []).some((e) => e.payload?.meta?.sample === true),
    [conversations.data],
  );

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Conversations</CardTitle>
          <CardSub>New conversations started with the AI agent (Instagram, website, Shopify, email)</CardSub>
        </div>
        {hasSample ? <SampleDataBadge /> : null}
      </CardHeader>
      {conversations.error ? (
        <ErrorState message={`Failed to load conversations: ${conversations.error}`} onRetry={conversations.retry} />
      ) : conversations.loading ? (
        <EmptyState title="Loading conversations…" />
      ) : !conversations.data || conversations.data.length === 0 ? (
        <EmptyState
          title="No conversations yet"
          message="Waiting for the first conversation webhook from n8n/GoHighLevel."
        />
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <Tr>
                <Th>Lead</Th>
                <Th>Channel</Th>
                <Th>Status</Th>
                <Th>Started</Th>
              </Tr>
            </thead>
            <tbody>
              {conversations.data.map((e) => (
                <Tr key={e.id}>
                  <Td>{displayName(e.payload, e.client_id)}</Td>
                  <Td>
                    <ChannelPill channel={e.payload?.channel} />
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
