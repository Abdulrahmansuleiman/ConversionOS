import { useEffect, useState, useCallback } from 'react';
import styled from 'styled-components';
import { FiArrowLeft, FiExternalLink, FiCheck, FiRotateCcw, FiFileText, FiLink, FiMessageSquare } from 'react-icons/fi';
import { client } from '../api/client';
import { theme, projectStatusColor, PHASES, phaseStatusColor } from '../theme';
import { StatusBadge, StarRating, Loading, EmptyState, formatDate, daysUntil } from '../components/ui';
import { Header } from '../components/Header';
import type { ProjectDetail as Detail, Milestone } from '../types';

const PHASE_ICON: Record<string, React.ReactNode> = {
  Kickoff: '01',
  Design: '02',
  Build: '03',
  Review: '04',
  Launch: '05',
  'Post-launch support': '06',
};

// --- Intake parsing ------------------------------------------------------
// The onboarding site writes project notes as:
//   [Onboarded via onboarding site]
//
//   <Discovery question>
//   <client's answer>
//
//   <next question>
//   <next answer>
// …
// Parse that into structured Q&A pairs so the UI can show a proper card
// instead of a raw text wall. Projects whose notes don't match this format
// (source tag, or more than one block) fall back to the raw notes panel.
type IntakeQA = { q: string; a: string };

function parseIntake(notes: string): { source: string | null; qas: IntakeQA[] } | null {
  const blocks = notes
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);
  if (!blocks.length) return null;

  let source: string | null = null;
  let rest = blocks;
  if (/^\[.*\]$/.test(blocks[0])) {
    source = blocks[0].replace(/^\[|\]$/g, '');
    rest = blocks.slice(1);
  }

  const qas: IntakeQA[] = [];
  for (const block of rest) {
    const nl = block.indexOf('\n');
    if (nl === -1) {
      qas.push({ q: block, a: '' });
      continue;
    }
    qas.push({ q: block.slice(0, nl).trim(), a: block.slice(nl + 1).trim() });
  }

  const structured = source !== null || qas.length > 1;
  return structured ? { source, qas } : null;
}

export function ProjectDetail({ projectId, onBack }: { projectId: string; onBack: () => void }) {
  const [data, setData] = useState<Detail | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    try {
      setData(await client.get<Detail>(`/api/projects/${projectId}`));
    } catch (e) {
      setError((e as Error).message);
    }
  }, [projectId]);

  useEffect(() => {
    load();
  }, [load]);

  if (error) return <EmptyState title="Couldn't load project" hint={error} />;
  if (!data) return <Loading label="Loading mission data" />;

  const { project, milestones, assets, feedback } = data;
  const launch = project['Launch Date'];
  const tMinus = daysUntil(launch);
  const doneCount = milestones.filter((m) => m.Status === 'Complete').length;
  const intake = project.Notes ? parseIntake(project.Notes) : null;

  const setMilestoneStatus = async (m: Milestone, next: string) => {
    await client.patch(`/api/milestones/${m.id}`, { Status: next });
    load();
  };

  return (
    <div>
      <Header
        title={project.title}
        subtitle={project.Industry || 'Client mission'}
        eyebrow={`Mission ${tMinus === null ? '' : tMinus > 0 ? `· launches in ${tMinus === 1 ? '1 day' : `${tMinus} days`}` : tMinus === 0 ? '· launches today' : '· already launched'}`}
      />

      <TopBar>
        <BackBtn onClick={onBack}>
          <FiArrowLeft /> All missions
        </BackBtn>
        <StatusBadge label={project.Status || '—'} color={projectStatusColor[project.Status || ''] || '#5B6787'} />
      </TopBar>

      <MetaStrip>
        {project['AI Persona'] && <MetaChip label="AI Persona" value={project['AI Persona']} />}
        {project.KPIs && <MetaChip label="KPIs" value={project.KPIs} />}
        {project['Kickoff Date'] && <MetaChip label="Kickoff" value={formatDate(project['Kickoff Date'])} />}
        {project['Launch Date'] && <MetaChip label="Launch" value={formatDate(project['Launch Date'])} accent />}
        {project['Dashboard URL'] && (
          <a href={project['Dashboard URL']} target="_blank" rel="noreferrer">
            <ChipLink><FiExternalLink size={13} /> Dashboard</ChipLink>
          </a>
        )}
        {project['Repo URL'] && (
          <a href={project['Repo URL']} target="_blank" rel="noreferrer">
            <ChipLink><FiLink size={13} /> Repo</ChipLink>
          </a>
        )}
      </MetaStrip>

      {project.Notes && !intake && <Notes>{project.Notes}</Notes>}

      {intake && (
        <IntakeCard>
          <IntakeHead>
            <IntakeTitle>
              <IntakeIcon><FiMessageSquare size={14} /></IntakeIcon>
              Client discovery
            </IntakeTitle>
            <IntakeBadges>
              {intake.source && <SourcePill>{intake.source}</SourcePill>}
              <CountPill>{intake.qas.length} answers</CountPill>
            </IntakeBadges>
          </IntakeHead>
          <IntakeGrid>
            {intake.qas.map((qa, i) => (
              <IntakeItem key={i}>
                <IntakeQ>{qa.q || 'Note'}</IntakeQ>
                <IntakeA>{qa.a || '—'}</IntakeA>
              </IntakeItem>
            ))}
          </IntakeGrid>
        </IntakeCard>
      )}

      <Grid3>
        <TimelineCard>
          <SectionRow>
            <SectionTitle>Launch sequence</SectionTitle>
            <StageCount>{doneCount}/{milestones.length} stages complete</StageCount>
          </SectionRow>
          <Timeline>
            {PHASES.map((phase) => {
              const ms = milestones.filter((m) => m.Phase === phase);
              if (!ms.length) {
                return (
                  <PhaseRow key={phase} $empty>
                    <Node $empty>
                      <span>{PHASE_ICON[phase]}</span>
                    </Node>
                    <PhaseBody>
                      <PhaseName>
                        {phase} <PhaseTag>STANDBY</PhaseTag>
                      </PhaseName>
                      <EmptyPhase>No milestone set for this stage</EmptyPhase>
                    </PhaseBody>
                  </PhaseRow>
                );
              }
              return ms.map((m) => {
                const color = phaseStatusColor[m.Status || ''] || '#5B6787';
                const mT = daysUntil(m['Due Date']);
                const isDone = m.Status === 'Complete';
                return (
                  <PhaseRow key={m.id} $empty={false}>
                    <Node $color={color} $done={isDone}>
                      <span>{PHASE_ICON[phase]}</span>
                    </Node>
                    <PhaseBody>
                      <PhaseName>
                        {phase}
                        {mT !== null && <TMinus $done={isDone}>{isDone ? 'done' : mT > 0 ? (mT === 1 ? '1 day left' : `${mT} days left`) : mT === 0 ? 'due today' : `${-mT === 1 ? '1' : -mT} days late`}</TMinus>}
                      </PhaseName>
                      <PhaseMeta>
                        <StatusBadge label={m.Status || 'Not started'} color={color} />
                        {m['Due Date'] && <span>due {formatDate(m['Due Date'])}</span>}
                      </PhaseMeta>
                      {m.Notes && <PhaseNotes>{m.Notes}</PhaseNotes>}
                      <AdvanceBtn
                        $done={isDone}
                        onClick={() => setMilestoneStatus(m, isDone ? 'In progress' : 'Complete')}
                      >
                        {isDone ? <><FiRotateCcw size={13} /> Reopen</> : <><FiCheck size={13} /> Mark complete</>}
                      </AdvanceBtn>
                    </PhaseBody>
                  </PhaseRow>
                );
              });
            })}
          </Timeline>
        </TimelineCard>

        <RightCol>
          <Card>
            <SectionTitle>Build assets</SectionTitle>
            {assets.length === 0 ? (
              <EmptyState title="No assets recorded" hint="Build specs, prompts, and workflow exports land here." />
            ) : (
              <AssetList>
                {assets.map((a) => (
                  <AssetRow key={a.id}>
                    <AssetIcon><FiFileText size={15} /></AssetIcon>
                    <div>
                      <AssetName>{a.title}</AssetName>
                      <AssetType>{a['Asset Type'] || 'Asset'}{a.Version ? ` · v${a.Version}` : ''}</AssetType>
                      {a.Content && <AssetContent>{a.Content}</AssetContent>}
                    </div>
                    {a.Link && (
                      <a href={a.Link} target="_blank" rel="noreferrer">
                        <AssetLink><FiExternalLink size={14} /></AssetLink>
                      </a>
                    )}
                  </AssetRow>
                ))}
              </AssetList>
            )}
          </Card>

          <Card>
            <SectionTitle>Client feedback</SectionTitle>
            {feedback.length === 0 ? (
              <EmptyState title="No feedback yet" hint="Their Notion feedback form submissions appear here." />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {feedback.map((f) => (
                  <FeedbackItem key={f.id}>
                    <StarRating value={f.Rating} />
                    {f['What Went Well'] && <FText><b>Went well —</b> {f['What Went Well']}</FText>}
                    {f['What Could Improve'] && <FText><b>Improve —</b> {f['What Could Improve']}</FText>}
                    <FDate>{formatDate(f.Submitted)}</FDate>
                  </FeedbackItem>
                ))}
              </div>
            )}
          </Card>
        </RightCol>
      </Grid3>
    </div>
  );
}

const TopBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

const BackBtn = styled.button`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 14px;
  border: 1px solid ${theme.colors.border};
  background: ${theme.colors.surface};
  border-radius: ${theme.radii.sm};
  font-size: 13px;
  font-weight: 500;
  color: ${theme.colors.text};
  &:hover { border-color: ${theme.colors.accent}; color: ${theme.colors.accent}; }
`;

const MetaStrip = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-bottom: 16px;
`;

function MetaChip({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <Chip $accent={accent}>
      <b>{value}</b>
      {label}
    </Chip>
  );
}

const Chip = styled.div<{ $accent?: boolean }>`
  display: flex;
  flex-direction: column;
  gap: 2px;
  background: ${theme.colors.surface};
  border: 1px solid ${({ $accent }) => ($accent ? 'rgba(255,180,58,0.35)' : theme.colors.border)};
  border-radius: ${theme.radii.md};
  padding: 9px 14px;
  font-size: 11px;
  letter-spacing: 0.03em;
  color: ${theme.colors.textMuted};
  b { color: ${({ $accent }) => ($accent ? theme.colors.accent : theme.colors.text)}; font-weight: 600; font-size: 13px; }
`;

const ChipLink = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 9px 14px;
  background: rgba(76, 201, 240, 0.1);
  color: ${theme.colors.accent2};
  border: 1px solid rgba(76, 201, 240, 0.25);
  border-radius: ${theme.radii.md};
  font-size: 13px;
  font-weight: 600;
`;

const Notes = styled.div`
  background: rgba(255, 180, 58, 0.06);
  border: 1px solid rgba(255, 180, 58, 0.25);
  border-radius: ${theme.radii.md};
  padding: 12px 16px;
  font-size: 13.5px;
  color: #FFD9A8;
  margin-bottom: 20px;
  white-space: pre-wrap;
  line-height: 1.6;
`;

// --- Client discovery (structured onboarding intake) ---
const IntakeCard = styled.div`
  background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.surface2} 100%);
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.lg};
  box-shadow: ${theme.shadows.card};
  padding: 20px 22px;
  margin-bottom: 20px;
`;

const IntakeHead = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  margin-bottom: 16px;
`;

const IntakeTitle = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-family: ${theme.fonts.display};
  font-weight: 600;
  font-size: 14.5px;
  letter-spacing: 0.01em;
`;

const IntakeIcon = styled.span`
  width: 30px;
  height: 30px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: ${theme.colors.accent2Soft};
  color: ${theme.colors.accent2};
  border: 1px solid rgba(76, 201, 240, 0.25);
`;

const IntakeBadges = styled.div`
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
`;

const SourcePill = styled.span`
  font-family: ${theme.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: ${theme.colors.accent2};
  background: ${theme.colors.accent2Soft};
  border: 1px solid rgba(76, 201, 240, 0.25);
  border-radius: 999px;
  padding: 4px 10px;
`;

const CountPill = styled.span`
  font-family: ${theme.fonts.mono};
  font-size: 10.5px;
  color: ${theme.colors.textMuted};
  border: 1px solid ${theme.colors.border};
  border-radius: 999px;
  padding: 4px 10px;
`;

const IntakeGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
  @media (max-width: 900px) { grid-template-columns: 1fr; }
`;

const IntakeItem = styled.div`
  background: ${theme.colors.surface2};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.md};
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-width: 0;
`;

const IntakeQ = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 10.5px;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: ${theme.colors.textMuted};
  line-height: 1.4;
`;

const IntakeA = styled.div`
  font-size: 13.5px;
  color: ${theme.colors.text};
  line-height: 1.55;
  white-space: pre-wrap;
  word-break: break-word;
`;

const Grid3 = styled.div`
  display: grid;
  grid-template-columns: 1.4fr 1fr;
  gap: 16px;
  align-items: start;
  @media (max-width: 1000px) { grid-template-columns: 1fr; }
`;

const RightCol = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const Card = styled.div`
  background: linear-gradient(180deg, ${theme.colors.surface} 0%, ${theme.colors.surface2} 100%);
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.lg};
  box-shadow: ${theme.shadows.card};
  padding: 22px;
`;

const SectionTitle = styled.h3`
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.01em;
`;

const SectionRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 18px;
`;

const StageCount = styled.span`
  font-family: ${theme.fonts.mono};
  font-size: 11px;
  color: ${theme.colors.textMuted};
`;

const TimelineCard = styled(Card)``;

const Timeline = styled.div`
  display: flex;
  flex-direction: column;
`;

const PhaseRow = styled.div<{ $empty?: boolean }>`
  display: grid;
  grid-template-columns: 44px 1fr;
  gap: 14px;
  position: relative;
  padding-bottom: 24px;
  &:not(:last-child)::before {
    content: '';
    position: absolute;
    left: 21px;
    top: 42px;
    bottom: 0;
    width: 2px;
    background: ${({ $empty }) => ($empty ? '#1B2740' : 'linear-gradient(180deg, #FFB43A 0%, #243047 100%)')};
  }
  &:last-child { padding-bottom: 4px; }
`;

const Node = styled.div<{ $color?: string; $empty?: boolean; $done?: boolean }>`
  width: 44px;
  height: 44px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.fonts.mono};
  font-size: 12px;
  font-weight: 600;
  color: ${({ $color, $empty }) => ($empty ? '#5B6787' : $color)};
  background: ${({ $color, $empty, $done }) => ($empty ? '#0D1522' : $done ? 'rgba(52, 211, 153, 0.14)' : `${$color}1a`)};
  border: 1px solid ${({ $color, $empty }) => ($empty ? '#1B2740' : $color)};
  box-shadow: ${({ $done }) => ($done ? '0 0 14px rgba(52, 211, 153, 0.35)' : 'none')};
  z-index: 1;
`;

const PhaseBody = styled.div`
  padding-top: 2px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
`;

const PhaseName = styled.div`
  font-family: ${theme.fonts.display};
  font-weight: 600;
  font-size: 15px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const PhaseTag = styled.span`
  font-family: ${theme.fonts.mono};
  font-size: 9px;
  letter-spacing: 0.14em;
  color: ${theme.colors.textFaint};
  border: 1px solid ${theme.colors.border};
  border-radius: 999px;
  padding: 2px 7px;
`;

const TMinus = styled.span<{ $done?: boolean }>`
  font-family: ${theme.fonts.mono};
  font-size: 11px;
  font-weight: 500;
  color: ${({ $done }) => ($done ? theme.colors.positive : theme.colors.accent)};
  background: ${({ $done }) => ($done ? 'rgba(52,211,153,0.1)' : theme.colors.accentSoft)};
  border-radius: 6px;
  padding: 2px 7px;
`;

const EmptyPhase = styled.div`
  font-size: 12.5px;
  color: ${theme.colors.textMuted};
  font-style: italic;
`;

const PhaseMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 12px;
  color: ${theme.colors.textMuted};
`;

const PhaseNotes = styled.div`
  font-size: 13px;
  color: ${theme.colors.text};
  background: ${theme.colors.surface2};
  border: 1px solid ${theme.colors.borderSoft};
  padding: 8px 12px;
  border-radius: ${theme.radii.sm};
  line-height: 1.5;
`;

const AdvanceBtn = styled.button<{ $done: boolean }>`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1px solid ${({ $done }) => ($done ? 'rgba(52,211,153,0.4)' : theme.colors.border)};
  background: ${({ $done }) => ($done ? 'rgba(52,211,153,0.1)' : theme.colors.surface2)};
  color: ${({ $done }) => ($done ? theme.colors.positive : theme.colors.textMuted)};
  border-radius: ${theme.radii.sm};
  font-size: 12.5px;
  font-weight: 600;
  &:hover { border-color: ${theme.colors.accent}; color: ${theme.colors.accent}; }
`;

const AssetList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const AssetRow = styled.div`
  display: grid;
  grid-template-columns: 34px 1fr auto;
  gap: 12px;
  align-items: flex-start;
  padding: 10px;
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.md};
  background: ${theme.colors.surface2};
`;

const AssetIcon = styled.div`
  width: 34px;
  height: 34px;
  border-radius: 9px;
  background: rgba(255, 180, 58, 0.1);
  color: ${theme.colors.accent};
  display: flex;
  align-items: center;
  justify-content: center;
`;

const AssetName = styled.div`
  font-weight: 600;
  font-size: 13.5px;
`;

const AssetType = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  margin-top: 1px;
`;

const AssetContent = styled.div`
  font-size: 12.5px;
  color: ${theme.colors.text};
  margin-top: 4px;
  line-height: 1.5;
  max-height: 60px;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
`;

const AssetLink = styled.span`
  color: ${theme.colors.accent2};
  font-size: 15px;
`;

const FeedbackItem = styled.div`
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.md};
  padding: 12px 14px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: ${theme.colors.surface2};
`;

const FText = styled.p`
  font-size: 13px;
  line-height: 1.5;
  b { font-weight: 600; color: ${theme.colors.accent}; }
`;

const FDate = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  font-family: ${theme.fonts.mono};
`;