// src/tabs/CalendarTab.tsx — month grid of bookings via GET /api/calendar (S10).
import { useState } from 'react';
import styled from 'styled-components';
import { useCalendar } from '../hooks/useCalendar';
import { monthLabel, toMonthKey } from '../utils/format';
import { Card, CardHeader, CardSub, CardTitle } from '../components/ui';
import { CalendarGrid } from '../components/CalendarGrid';
import { MonthNav } from '../components/MonthNav';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';

const Padded = styled.div`
  padding: 20px;
`;

export function CalendarTab() {
  const [month, setMonth] = useState(() => toMonthKey(new Date()));
  const calendar = useCalendar(month);

  const changeMonth = (delta: number) => {
    const [y, m] = month.split('-').map(Number);
    const d = new Date(y, m - 1 + delta, 1);
    setMonth(toMonthKey(d));
  };

  const count = calendar.data?.bookings.length ?? 0;

  return (
    <Card>
      <CardHeader>
        <div>
          <CardTitle>Calendar</CardTitle>
          <CardSub>
            {count === 0
              ? 'No bookings in this month'
              : `${count} booking${count === 1 ? '' : 's'} in this month`}
          </CardSub>
        </div>
        <MonthNav label={monthLabel(month)} onPrev={() => changeMonth(-1)} onNext={() => changeMonth(1)} />
      </CardHeader>
      {calendar.error ? (
        <ErrorState message={`Failed to load calendar: ${calendar.error}`} onRetry={calendar.retry} />
      ) : calendar.loading ? (
        <EmptyState title="Loading calendar…" />
      ) : (
        <Padded>
          <CalendarGrid month={month} bookings={calendar.data?.bookings ?? []} />
        </Padded>
      )}
    </Card>
  );
}
