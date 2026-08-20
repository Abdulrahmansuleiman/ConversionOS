// src/tabs/DashboardTab.tsx — Overview: timeframe toggle, 5 KPI cards (3+2 grid),
// conversion donut, weekly trend, TOP 5 LEADS (spec §1.2/§3.3/§4.9/§4.11).
import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { useKpis } from '../hooks/useKpis';
import { useEvents } from '../hooks/useEvents';
import { useTopLeads } from '../hooks/useTopLeads';
import { useTrend } from '../hooks/useTrend';
import { theme } from '../theme';
import type { KpiKey, Timeframe } from '../types/events';
import { TimeframeToggle } from '../components/TimeframeToggle';
import { KpiCard } from '../components/KpiCard';
import { SampleDataBadge } from '../components/SampleDataBadge';
import { EmptyState } from '../components/EmptyState';
import { ErrorState } from '../components/ErrorState';
import { ConversionDonut, type DonutSegment } from '../components/charts/ConversionDonut';
import { WeeklyTrend } from '../components/charts/WeeklyTrend';
import { CardHeader, CardSub, CardTitle } from '../components/ui';

const TIMEFRAME_LABELS: Record<Timeframe, string> = {
  today: 'Today',
  this_week: 'This Week',
  last_week: 'Last Week',
  last_month: 'Last Month',
  last_2_months: 'Last 2 Months',
};

const KPI_META: { key: KpiKey; label: string; color: string }[] = [
  { key: 'bookings', label: 'Bookings', color: theme.colors.kpi.bookings },
  { key: 'humanTransfers', label: 'Human Transfers', color: theme.colors.kpi.humanTransfers },
  { key: 'totalConversations', label: 'Total Conversations', color: theme.colors.kpi.totalConversations },
  { key: 'followUps', label: 'Follow-ups', color: theme.colors.kpi.followUps },
  { key: 'leadsQualified', label: 'Leads Qualified', color: theme.colors.kpi.leadsQualified },
];

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  margin: 0;
  font-size: 16px;
  font-weight: 800;
  letter-spacing: -0.01em;
  color: ${(p) => p.theme.colors.textPrimary};
`;

const TopRight = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
`;

const TopRow = styled.div`
  display: grid;
  grid-template-columns: 1.3fr 1fr;
  gap: 16px;
  align-items: stretch;
  margin-bottom: 16px;

  @media (max-width: 1080px) {
    grid-template-columns: 1fr;
  }
`;

const KpiGrid = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-width: 0;
`;

const KpiRow = styled.div<{ $cols: number }>`
  display: grid;
  grid-template-columns: repeat(${(p) => p.$cols}, 1fr);
  gap: 16px;
  flex: 1;
`;

const DarkCard = styled.section`
  background: ${(p) => p.theme.colors.ink};
  border: 1px solid ${(p) => p.theme.colors.inkBorder};
  border-radius: ${(p) => p.theme.radii.card};
  box-shadow: ${(p) => p.theme.shadows.card};
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const DarkCardHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 12px;
`;

const DarkTitle = styled.div`
  font-size: 13.5px;
  font-weight: 700;
  color: ${(p) => p.theme.colors.onDark};
`;

const DarkSub = styled.div`
  font-size: 11.5px;
  color: ${(p) => p.theme.colors.onDarkMuted};
`;

const LeadCard = styled.div`
  margin-top: 16px;
`;

const LeadList = styled.ol`
  list-style: none;
  margin: 0;
  padding: 6px 20px;
`;

const LeadRow = styled.li`
  display: flex;
  align-items: center;
  gap: 14px;
  padding: 12px 0;
  border-bottom: 1px solid ${(p) => p.theme.colors.border};

  &:last-child {
    border-bottom: none;
  }
`;

const Rank = styled.span`
  width: 26px;
  height: 26px;
  border-radius: 8px;
  background: ${(p) => p.theme.colors.accentSoft};
  color: ${(p) => p.theme.colors.accent};
  font-size: 12.5px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  font-variant-numeric: tabular-nums;
`;

const LeadName = styled.span`
  font-size: 13.5px;
  font-weight: 600;
  color: ${(p) => p.theme.colors.textPrimary};
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const LeadBarTrack = styled.div`
  flex: 1;
  height: 6px;
  border-radius: 6px;
  background: ${(p) => p.theme.colors.bg};
  overflow: hidden;
  min-width: 60px;
`;

const LeadBar = styled.div<{ $width: number }>`
  height: 100%;
  border-radius: 6px;
  background: ${(p) => p.theme.colors.accentGradient};
  width: ${(p) => p.$width}%;
  transition: width 0.4s ease;
`;

const LeadScore = styled.span`
  font-size: 12.5px;
  font-weight: 700;
  color: ${(p) => p.theme.colors.textSecondary};
  font-variant-numeric: tabular-nums;
  white-space: nowrap;
`;

export function DashboardTab() {
  const [timeframe, setTimeframe] = useState<Timeframe>('today');
  const kpis = useKpis(timeframe);
  const trend = useTrend(timeframe);
  const top = useTopLeads(timeframe, 5);
  const bookings = useEvents({ eventType: 'booking_made', timeframe });

  const segments: DonutSegment[] = useMemo(() => {
    const counts = new Map<string, number>();
    for (const e of bookings.data ?? []) {
      const ch = e.payload?.channel;
      const key = typeof ch === 'string' && ch.trim() !== '' ? ch.trim() : 'Unknown';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return [...counts.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [bookings.data]);

  const hasSample = useMemo(
    () => (bookings.data ?? []).some((e) => e.payload?.meta?.sample === true),
    [bookings.data],
  );

  const maxEngagement = Math.max(1, ...(top.data?.leads.map((l) => l.engagement) ?? [1]));

  return (
    <div>
      <TopBar>
        <SectionTitle>Overview</SectionTitle>
        <TopRight>
          {hasSample ? <SampleDataBadge /> : null}
          <TimeframeToggle value={timeframe} onChange={setTimeframe} />
        </TopRight>
      </TopBar>

      <TopRow>
        <KpiGrid>
          {kpis.error ? (
            <ErrorState message={`Failed to load KPIs: ${kpis.error}`} onRetry={kpis.retry} />
          ) : !kpis.data ? (
            <EmptyState title="Loading KPIs…" />
          ) : (
            <>
              <KpiRow $cols={3}>
                {KPI_META.slice(0, 3).map((meta) => (
                  <KpiCard
                    key={meta.key}
                    label={meta.label}
                    value={kpis.data!.current[meta.key]}
                    change={kpis.data!.changes[meta.key]}
                    dotColor={meta.color}
                  />
                ))}
              </KpiRow>
              <KpiRow $cols={2}>
                {KPI_META.slice(3, 5).map((meta) => (
                  <KpiCard
                    key={meta.key}
                    label={meta.label}
                    value={kpis.data!.current[meta.key]}
                    change={kpis.data!.changes[meta.key]}
                    dotColor={meta.color}
                  />
                ))}
              </KpiRow>
            </>
          )}
        </KpiGrid>

        <DarkCard>
          <DarkCardHeader>
            <div>
              <DarkTitle>Conversion Breakdown</DarkTitle>
              <DarkSub>Bookings by channel</DarkSub>
            </div>
          </DarkCardHeader>
          {bookings.error ? (
            <ErrorState message={`Failed to load bookings: ${bookings.error}`} onRetry={bookings.retry} />
          ) : bookings.loading ? (
            <EmptyState title="Loading bookings…" />
          ) : (
            <ConversionDonut data={segments} />
          )}
        </DarkCard>
      </TopRow>

      <DarkCard>
        <DarkCardHeader>
          <div>
            <DarkTitle>Weekly Booking Trend</DarkTitle>
            <DarkSub>Bookings per day — {TIMEFRAME_LABELS[timeframe]}</DarkSub>
          </div>
        </DarkCardHeader>
        {trend.error ? (
          <ErrorState message={`Failed to load trend: ${trend.error}`} onRetry={trend.retry} />
        ) : trend.loading ? (
          <EmptyState title="Loading trend…" />
        ) : (
          <WeeklyTrend buckets={trend.data?.buckets ?? []} variant="dark" />
        )}
      </DarkCard>

      <LeadCard>
        <CardHeader>
          <div>
            <CardTitle>Top 5 Leads</CardTitle>
            <CardSub>Ranked by engagement from persisted events — {TIMEFRAME_LABELS[timeframe]}</CardSub>
          </div>
        </CardHeader>
        {top.error ? (
          <ErrorState message={`Failed to load top leads: ${top.error}`} onRetry={top.retry} />
        ) : top.loading ? (
          <EmptyState title="Loading leads…" />
        ) : top.data && top.data.leads.length > 0 ? (
          <LeadList>
            {top.data.leads.map((lead, i) => (
              <LeadRow key={lead.client_id}>
                <Rank>{i + 1}</Rank>
                <LeadName title={lead.name ?? lead.client_id}>{lead.name ?? lead.client_id}</LeadName>
                <LeadBarTrack>
                  <LeadBar $width={(lead.engagement / maxEngagement) * 100} />
                </LeadBarTrack>
                <LeadScore>
                  {lead.engagement} event{lead.engagement === 1 ? '' : 's'}
                </LeadScore>
              </LeadRow>
            ))}
          </LeadList>
        ) : (
          <EmptyState
            title="No leads in this timeframe"
            message="Once webhook events land from n8n/GoHighLevel, top leads are ranked here by engagement (event count)."
          />
        )}
      </LeadCard>
    </div>
  );
}
