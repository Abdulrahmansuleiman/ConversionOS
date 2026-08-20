// src/components/charts/ConversionDonut.tsx — bookings by channel donut
// (spec §4.11). Segments = booking_made events grouped by payload.channel;
// unknown/missing channel -> single "Unknown" segment. Zero bookings renders an
// empty state, never a fake 100% slice.
import styled from 'styled-components';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { theme } from '../../theme';
import { EmptyState } from '../EmptyState';

export interface DonutSegment {
  name: string;
  value: number;
}

interface ConversionDonutProps {
  data: DonutSegment[];
}

const ChartWrap = styled.div`
  width: 100%;
  height: 190px;
`;

const Legend = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 6px;
`;

const LegendRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 12.5px;
  color: ${(p) => p.theme.colors.onDarkMuted};
`;

const LegendDot = styled.span<{ $color: string }>`
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: ${(p) => p.$color};
  flex-shrink: 0;
`;

const LegendCount = styled.span`
  margin-left: auto;
  color: ${(p) => p.theme.colors.onDark};
  font-weight: 600;
  font-variant-numeric: tabular-nums;
`;

// Segment colors: green monochrome scale by index (matching the reference
// dashboard's green donut); the "Unknown" segment stays neutral gray.
function segmentColor(name: string, index: number): string {
  if (name.toLowerCase() === 'unknown') return theme.colors.channels.other;
  const scale = theme.colors.donutScale;
  return scale[index % scale.length];
}

export function ConversionDonut({ data }: ConversionDonutProps) {
  const total = data.reduce((sum, s) => sum + s.value, 0);
  if (total === 0) {
    return (
      <EmptyState
        title="No bookings yet"
        message="The conversion breakdown will appear here once the first booking webhook lands from n8n/GoHighLevel."
      />
    );
  }

  return (
    <div>
      <ChartWrap>
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              nameKey="name"
              innerRadius={52}
              outerRadius={80}
              paddingAngle={2}
              stroke="none"
            >
              {data.map((segment, i) => (
                <Cell key={segment.name} fill={segmentColor(segment.name, i)} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value, name) => {
                const n = typeof value === 'number' ? value : Number(value ?? 0);
                return [`${n} booking${n === 1 ? '' : 's'}`, name];
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
          </PieChart>
        </ResponsiveContainer>
      </ChartWrap>
      <Legend>
        {data.map((segment, i) => (
          <LegendRow key={segment.name}>
            <LegendDot $color={segmentColor(segment.name, i)} aria-hidden="true" />
            <span>{segment.name}</span>
            <LegendCount>
              {segment.value} ({Math.round((segment.value / total) * 100)}%)
            </LegendCount>
          </LegendRow>
        ))}
      </Legend>
    </div>
  );
}
