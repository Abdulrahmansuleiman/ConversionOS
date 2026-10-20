import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { FiFolder, FiZap, FiGlobe, FiStar } from 'react-icons/fi';
import { client } from '../api/client';
import { theme, projectStatusColor } from '../theme';
import { Card, StarRating, Loading, EmptyState, formatDate, daysUntil } from '../components/ui';
import { Header } from '../components/Header';
import type { Overview as OverviewData } from '../types';

export function Overview({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const [data, setData] = useState<OverviewData | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    client.get<OverviewData>('/api/overview').then(setData).catch((e) => setError(e.message));
  }, []);

  if (error) return <EmptyState title="Couldn't load overview" hint={error} />;
  if (!data) return <Loading label="Standing up flight deck" />;

  const pieData = Object.entries(data.statusBreakdown)
    .map(([name, value]) => ({ name, value }))
    .filter((d) => d.value > 0);

  const hero = launchHero(data);
  const avg = data.avgRating;

  return (
    <div>
      <Header title="Overview" subtitle="Your agency at a glance — every mission in one place" eyebrow="Flight deck" />

      <Hero>
        <HeroLeft>
          <HeroLabel>{hero.label}</HeroLabel>
          <HeroValue>{hero.value}</HeroValue>
          <HeroSub>{hero.sub}</HeroSub>
        </HeroLeft>
        <HeroRight>
          <HeroStat>
            <HeroStatNum>{String(data.totalProjects).padStart(2, '0')}</HeroStatNum>
            <HeroStatLabel>MISSIONS</HeroStatLabel>
          </HeroStat>
          <HeroStat>
            <HeroStatNum>{String(data.liveDashboards).padStart(2, '0')}</HeroStatNum>
            <HeroStatLabel>LIVE</HeroStatLabel>
          </HeroStat>
        </HeroRight>
      </Hero>

      <KpiGrid>
        <KpiCard
          icon={<FiFolder />}
          color="#8B96AC"
          label="Total projects"
          value={String(data.totalProjects)}
          hint="Every client on record"
        />
        <KpiCard
          icon={<FiZap />}
          color="#FFB43A"
          label="Active projects"
          value={String(data.activeProjects)}
          hint="In delivery or live — completed clients still count"
        />
        <KpiCard
          icon={<FiGlobe />}
          color="#34D399"
          label="Live dashboards"
          value={String(data.liveDashboards)}
          hint="Built and deployed, with a dashboard link"
        />
        <KpiCard
          icon={<FiStar />}
          color="#4CC9F0"
          label="Average rating"
          value={avg === null ? '—' : `${Number(avg).toFixed(1)}/10`}
          hint={
            avg === null
              ? 'No client ratings yet'
              : `From ${data.feedbackCount} feedback response${data.feedbackCount === 1 ? '' : 's'}`
          }
        />
      </KpiGrid>

      <Grid2>
        <Card>
          <SectionTitle>Projects by status</SectionTitle>
          {pieData.length ? (
            <ChartBox>
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={pieData} dataKey="value" nameKey="name" innerRadius={58} outerRadius={86} paddingAngle={3} strokeWidth={0}>
                    {pieData.map((entry) => (
                      <Cell key={entry.name} fill={projectStatusColor[entry.name] || '#5B6787'} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#111A2B', border: '1px solid #243047', borderRadius: 10, fontSize: 13 }}
                    itemStyle={{ color: '#EAF1F9' }}
                    labelStyle={{ color: '#8B96AC' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <Legend>
                {pieData.map((entry) => (
                  <LegendItem key={entry.name}>
                    <span style={{ background: projectStatusColor[entry.name] || '#5B6787' }} />
                    {entry.name} · {entry.value}
                  </LegendItem>
                ))}
              </Legend>
            </ChartBox>
          ) : (
            <EmptyState title="No projects yet" hint="Create your first project in Notion and it appears here." />
          )}
        </Card>

        <Card>
          <SectionTitle>Latest feedback</SectionTitle>
          {data.recentFeedback.length ? (
            <FeedList>
              {data.recentFeedback.map((f) => (
                <FeedRow key={f.id} onClick={() => f.projectId && onOpenProject(f.projectId)}>
                  <StarRating value={f.rating} max={10} />
                  <FeedTitle>{f.title}</FeedTitle>
                  <FeedDate>{formatDate(f.submitted)}</FeedDate>
                </FeedRow>
              ))}
            </FeedList>
          ) : (
            <EmptyState title="No feedback yet" hint="Send a client their Notion feedback form — responses land here." />
          )}
        </Card>
      </Grid2>
    </div>
  );
}

// Next launch = soonest date from today. With no upcoming date we show the most
// recent launch instead of a bare dash, so the panel is never empty when the
// agency has shipped something. The label changes with it.
function launchHero(data: OverviewData) {
  const dated = data.launches.filter((l) => l.launchDate);
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = dated
    .filter((l) => l.launchDate >= today)
    .sort((a, b) => a.launchDate.localeCompare(b.launchDate))[0];
  if (upcoming) return { label: 'NEXT LAUNCH', value: formatDate(upcoming.launchDate), sub: launchSub(upcoming) };

  const latest = [...dated].sort((a, b) => b.launchDate.localeCompare(a.launchDate))[0];
  if (latest) return { label: 'LATEST LAUNCH', value: formatDate(latest.launchDate), sub: launchSub(latest) };

  return { label: 'NEXT LAUNCH', value: '—', sub: 'No launch dates recorded yet' };
}

function launchSub(l: { title: string; launchDate: string }) {
  const n = daysUntil(l.launchDate);
  if (n === null) return `${l.title} · launch date not set`;
  if (n === 0) return `${l.title} launches today`;
  if (n < 0) return `${l.title} launched ${-n === 1 ? 'yesterday' : `${-n} days ago`}`;
  return `${l.title} launches in ${n === 1 ? '1 day' : `${n} days`}`;
}

function KpiCard({
  icon,
  color,
  label,
  value,
  hint,
}: {
  icon: React.ReactNode;
  color: string;
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <Card>
      <KpiTop>
        <IconBox $color={color}>{icon}</IconBox>
        <KpiValue>{value}</KpiValue>
      </KpiTop>
      <KpiLabel>{label}</KpiLabel>
      {hint && <KpiHint>{hint}</KpiHint>}
    </Card>
  );
}

const Hero = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  margin-bottom: 20px;
  padding: 24px 28px;
  border-radius: ${theme.radii.lg};
  background:
    radial-gradient(600px 200px at 90% -20%, rgba(255, 180, 58, 0.1), transparent 70%),
    linear-gradient(180deg, #111A2B 0%, #0D1522 100%);
  border: 1px solid ${theme.colors.border};
  box-shadow: ${theme.shadows.card};
  position: relative;
  overflow: hidden;
  &::after {
    content: '';
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 180, 58, 0.5), transparent);
  }
  @media (max-width: 640px) { flex-direction: column; align-items: flex-start; }
`;

const HeroLeft = styled.div``;

const HeroLabel = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.26em;
  color: ${theme.colors.accent};
  margin-bottom: 8px;
`;

const HeroValue = styled.div`
  font-family: ${theme.fonts.display};
  font-size: 42px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${theme.colors.text};
  line-height: 1;
`;

const HeroSub = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin-top: 10px;
`;

const HeroRight = styled.div`
  display: flex;
  gap: 28px;
  @media (max-width: 640px) { width: 100%; justify-content: space-between; }
`;

const HeroStat = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  @media (max-width: 640px) { align-items: flex-start; }
`;

const HeroStatNum = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 32px;
  font-weight: 600;
  color: ${theme.colors.accent};
  line-height: 1;
`;

const HeroStatLabel = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 9.5px;
  letter-spacing: 0.2em;
  color: ${theme.colors.textFaint};
  margin-top: 6px;
`;

const KpiGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  margin-bottom: 20px;
`;

const KpiTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 14px;
`;

const IconBox = styled.div<{ $color: string }>`
  width: 40px;
  height: 40px;
  border-radius: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ $color }) => $color};
  background: ${({ $color }) => `${$color}1a`};
  border: 1px solid ${({ $color }) => `${$color}33`};
  font-size: 18px;
`;

const KpiValue = styled.div`
  font-family: ${theme.fonts.display};
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: ${theme.colors.text};
`;

const KpiLabel = styled.div`
  color: ${theme.colors.textMuted};
  font-size: 13px;
`;

const KpiHint = styled.div`
  margin-top: 4px;
  font-family: ${theme.fonts.mono};
  font-size: 10.5px;
  line-height: 1.45;
  color: ${theme.colors.textFaint};
`;

const Grid2 = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
  margin-bottom: 16px;
`;

const ChartBox = styled.div``;

const Legend = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px 18px;
  margin-top: 6px;
`;

const LegendItem = styled.div`
  display: flex;
  align-items: center;
  gap: 6px;
  font-family: ${theme.fonts.mono};
  font-size: 11.5px;
  color: ${theme.colors.textMuted};
  span { width: 8px; height: 8px; border-radius: 2px; display: inline-block; }
`;

const FeedList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

const FeedRow = styled.div`
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 12px;
  padding: 11px 12px;
  border-radius: 10px;
  transition: background 0.12s ease;
  &:hover { background: rgba(255, 180, 58, 0.05); }
`;

const FeedTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const FeedDate = styled.div`
  font-size: 12.5px;
  color: ${theme.colors.textMuted};
`;