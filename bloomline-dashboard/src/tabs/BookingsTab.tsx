// src/tabs/BookingsTab.tsx — bookings list + calendar view toggle (spec S10).
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useEvents } from '../hooks/useEvents';
import type { CalendarBooking, NormalizedEvent } from '../types/events';
import { displayName, formatDateTime, monthLabel, toMonthKey } from '../utils/format';
import { Card, CardHeader, CardSub, CardTitle, ChannelPill, StatusPill, Table, Td, Th, Tr } from '../components/ui';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { SampleDataBadge } from '../components/SampleDataBadge';
import { CalendarGrid } from '../components/CalendarGrid';
import { MonthNav } from '../components/MonthNav';

type View = 'list' | 'calendar';

function toCalendarBooking(e: NormalizedEvent): CalendarBooking {
  return {
    event_id: e.id,
    date_time: e.timestamp,
    lead_name:
      typeof e.payload?.lead_name === 'string' && e.payload.lead_name.trim() !== '' ? e.payload.lead_name : null,
    client_id: e.client_id,
    channel: typeof e.payload?.channel === 'string' ? e.payload.channel : null,
    status: typeof e.payload?.status === 'string' ? e.payload.status : null,
  };
}

const ViewToggle = styled.div`
  display: inline-flex;
  background: ${(p) => p.theme.colors.surface};
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: ${(p) => p.theme.radii.button};
  padding: 3px;
  gap: 2px;
`;

const ViewButton = styled.button<{ $active: boolean }>`
  border: none;
  background: ${(p) => (p.$active ? p.theme.colors.accent : 'transparent')};
  color: ${(p) => (p.$active ? '#fff' : p.theme.colors.textSecondary)};
  font-size: 12px;
  font-weight: 600;
  padding: 6px 14px;
  border-radius: 7px;
  cursor: pointer;
`;

export function BookingsTab() {
  const bookings = useEvents({ eventType: 'booking_made' });
  const [view, setView] = useState<View>('list');
  const [month, setMonth] = useState(() => toMonthKey(new Date()));

  const hasSample = useMemo(() => (bookings.data ?? []).some((e) => e.payload?.meta?.sample === true), [bookings.data]);

  const monthLabel_ = monthLabel(month);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(toMonthKey(d));
  };

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Bookings</CardTitle>
          <CardSub>Every meeting or call your AI agent has booked</CardSub>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {hasSample ? <SampleDataBadge /> : null}
          {view === 'calendar' ? (
            <MonthNav label={monthLabel_} onPrev={() => changeMonth(-1)} onNext={() => changeMonth(1)} />
          ) : null}
          <ViewToggle>
            <ViewButton $active={view === 'list'} onClick={() => setView('list')}>
              List
            </ViewButton>
            <ViewButton $active={view === 'calendar'} onClick={() => setView('calendar')}>
              Calendar
            </ViewButton>
          </ViewToggle>
        </div>
      </CardHeader>

      {bookings.error ? (
        <ErrorState message={`Failed to load bookings: ${bookings.error}`} onRetry={bookings.retry} />
      ) : bookings.loading ? (
        <EmptyState title="Loading bookings…" />
      ) : !bookings.data || bookings.data.length === 0 ? (
        <EmptyState
          title="No bookings yet"
          message="Waiting for the first booking webhook from n8n/GoHighLevel."
          hint="Events of type booking_made will appear here."
        />
      ) : view === 'list' ? (
        <div style={{ overflowX: 'auto' }}>
          <Table>
            <thead>
              <Tr>
                <Th>Lead</Th>
                <Th>Channel</Th>
                <Th>Status</Th>
                <Th>Date &amp; time</Th>
              </Tr>
            </thead>
            <tbody>
              {bookings.data.map((e) => (
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
      ) : (
        <div style={{ padding: 20 }}>
          <CalendarGrid month={month} bookings={bookings.data.map(toCalendarBooking)} />
        </div>
      )}
    </Card>
  );
}
