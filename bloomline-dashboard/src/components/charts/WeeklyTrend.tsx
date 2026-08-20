// src/components/charts/WeeklyTrend.tsx — bookings per day (spec §3.3, §4.8
// GET /api/trend). Zero-count days are real stored zeros, never invented rows.
// Renders on the dark trend card (variant="dark", default).
import styled from 'styled-components';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { theme as globalTheme } from '../../theme';
import type { TrendBucket } from '../../types/events';
import { formatDayKey } from '../../utils/format';
import { EmptyState } from '../EmptyState';

interface WeeklyTrendProps {
  buckets: TrendBucket[];
  variant?: 'dark' | 'light';
}

const ChartWrap = styled.div`
  width: 100%;
  height: 240px;
`;

export function WeeklyTrend({ buckets, variant = 'dark' }: WeeklyTrendProps) {
  if (!buckets.length) {
    return (
      <EmptyState
        title="No trend data"
        message="The booking trend will appear here once booking webhooks start landing."
      />
    );
  }

  const isDark = variant === 'dark';
  const tickFill = isDark ? globalTheme.colors.onDarkMuted : globalTheme.colors.textMuted;
  const gridStroke = isDark ? 'rgba(255, 255, 255, 0.09)' : globalTheme.colors.chartGrid;
  const cursorFill = isDark ? 'rgba(22, 163, 74, 0.10)' : 'rgba(22, 163, 74, 0.06)';

  const data = buckets.map((b) => ({ day: formatDayKey(b.date), count: b.count }));

  return (
    <ChartWrap>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 12, right: 8, left: -18, bottom: 0 }} barCategoryGap="28%">
          <CartesianGrid vertical={false} stroke={gridStroke} strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tickLine={false}
            axisLine={false}
            tick={{ fontSize: 11.5, fill: tickFill }}
            interval="preserveStartEnd"
          />
          <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={{ fontSize: 11.5, fill: tickFill }} />
          <Tooltip
            cursor={{ fill: cursorFill }}
            formatter={(value) => {
              const n = typeof value === 'number' ? value : Number(value ?? 0);
              return [`${n} booking${n === 1 ? '' : 's'}`, 'Bookings'];
            }}
            contentStyle={{
              background: '#201a2d',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              fontSize: 12.5,
            }}
            itemStyle={{ color: '#f4f1f8' }}
            labelStyle={{ color: '#a9a2b8' }}
          />
          <Bar dataKey="count" fill={globalTheme.colors.accent} radius={[6, 6, 0, 0]} maxBarSize={36} />
        </BarChart>
      </ResponsiveContainer>
    </ChartWrap>
  );
}
