// src/components/CalendarGrid.tsx — month grid of bookings (shared by the
// Bookings tab calendar view and the Calendar tab; spec S10).
// Purely presentational: parent supplies the month key + bookings; cells show
// the lead name and time of each booking on its local calendar day.
import styled from 'styled-components';
import type { CalendarBooking } from '../types/events';
import { displayName, formatTime } from '../utils/format';
import { EmptyState } from './EmptyState';

interface CalendarGridProps {
  month: string; // YYYY-MM (local month the grid shows)
  bookings: CalendarBooking[];
}

const WEEKDAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(7, 1fr);
  border: 1px solid ${(p) => p.theme.colors.border};
  border-radius: 12px;
  overflow: hidden;
  background: ${(p) => p.theme.colors.surface};
`;

const DayHeader = styled.div`
  background: ${(p) => p.theme.colors.bg};
  color: ${(p) => p.theme.colors.textSecondary};
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  text-align: center;
  padding: 8px 4px;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
`;

const DayCell = styled.div<{ $isEmpty?: boolean; $today?: boolean }>`
  min-height: 84px;
  padding: 6px;
  border-right: 1px solid ${(p) => p.theme.colors.border};
  border-bottom: 1px solid ${(p) => p.theme.colors.border};
  background: ${(p) => (p.$today ? p.theme.colors.accentSoft : p.theme.colors.surface)};

  &:nth-child(7n) {
    border-right: none;
  }

  ${(p) => p.$isEmpty && `background: ${p.theme.colors.bg}; opacity: 0.55;`}
`;

const DayNumber = styled.div`
  font-size: 11.5px;
  font-weight: 700;
  color: ${(p) => p.theme.colors.textMuted};
  margin-bottom: 4px;
`;

const BookingChip = styled.div`
  background: ${(p) => p.theme.colors.accentSoft};
  color: ${(p) => p.theme.colors.textPrimary};
  border-left: 3px solid ${(p) => p.theme.colors.accent};
  border-radius: 6px;
  padding: 3px 6px;
  font-size: 11px;
  line-height: 1.35;
  margin-bottom: 3px;
  overflow: hidden;
  white-space: nowrap;
  text-overflow: ellipsis;
`;

const BookingTime = styled.span`
  color: ${(p) => p.theme.colors.textMuted};
  font-weight: 600;
`;

export function CalendarGrid({ month, bookings }: CalendarGridProps) {
  const [y, m] = month.split('-').map(Number);
  const first = new Date(y, m - 1, 1);
  const daysInMonth = new Date(y, m, 0).getDate();
  const startWeekday = (first.getDay() + 6) % 7; // Monday = 0

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i += 1) cells.push(null);
  for (let d = 1; d <= daysInMonth; d += 1) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);

  const byDay = new Map<number, CalendarBooking[]>();
  for (const b of bookings) {
    const dt = new Date(b.date_time);
    if (dt.getFullYear() === y && dt.getMonth() === m - 1) {
      const day = dt.getDate();
      const list = byDay.get(day) ?? [];
      list.push(b);
      byDay.set(day, list);
    }
  }
  for (const list of byDay.values()) {
    list.sort((a, b) => Date.parse(a.date_time) - Date.parse(b.date_time));
  }

  const today = new Date();
  const todayKey =
    today.getFullYear() === y && today.getMonth() === m - 1 ? today.getDate() : null;

  const hasAny = bookings.length > 0;

  return (
    <Grid>
      {WEEKDAYS.map((w) => (
        <DayHeader key={w}>{w}</DayHeader>
      ))}
      {cells.map((day, i) => {
        if (day === null) {
          return <DayCell key={`empty-${i}`} $isEmpty />;
        }
        const dayBookings = byDay.get(day) ?? [];
        return (
          <DayCell key={day} $today={todayKey === day}>
            <DayNumber>{day}</DayNumber>
            {dayBookings.map((b) => (
              <BookingChip key={b.event_id} title={`${displayName({ lead_name: b.lead_name ?? undefined }, b.client_id)} — ${formatTime(b.date_time)}`}>
                <BookingTime>{formatTime(b.date_time)}</BookingTime> {displayName({ lead_name: b.lead_name ?? undefined }, b.client_id)}
              </BookingChip>
            ))}
          </DayCell>
        );
      })}
      {!hasAny && (
        <div style={{ gridColumn: '1 / -1' }}>
          <EmptyState
            title="No bookings this month"
            message="Bookings from the AI agent will appear on the calendar once webhooks land."
          />
        </div>
      )}
    </Grid>
  );
}
