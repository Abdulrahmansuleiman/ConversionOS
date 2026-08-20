import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { FiExternalLink, FiArrowRight } from 'react-icons/fi';
import { client } from '../api/client';
import { theme, projectStatusColor } from '../theme';
import { Card, StatusBadge, Avatar, ProgressBar, Loading, EmptyState, formatDate, daysUntil } from '../components/ui';
import { Header } from '../components/Header';
import type { Project, Milestone } from '../types';

export function Projects({ onOpenProject }: { onOpenProject: (id: string) => void }) {
  const [projects, setProjects] = useState<Project[] | null>(null);
  const [milestones, setMilestones] = useState<Record<string, Milestone[]>>({});
  const [error, setError] = useState('');

  useEffect(() => {
    (async () => {
      try {
        const [p, m] = await Promise.all([
          client.get<Project[]>('/api/projects'),
          client.get<Milestone[]>('/api/milestones'),
        ]);
        setProjects(p);
        const byProject: Record<string, Milestone[]> = {};
        for (const row of m) {
          for (const pid of row.Project) {
            (byProject[pid] = byProject[pid] || []).push(row);
          }
        }
        setMilestones(byProject);
      } catch (e) {
        setError((e as Error).message);
      }
    })();
  }, []);

  if (error) return <EmptyState title="Couldn't load projects" hint={error} />;
  if (!projects) return <Loading label="Loading missions" />;

  return (
    <div>
      <Header
        title="Projects"
        subtitle={`${projects.length} client mission${projects.length === 1 ? '' : 's'} on record`}
        eyebrow="Mission log"
      />
      {projects.length === 0 ? (
        <EmptyState title="No missions yet" hint="Projects created in the Notion LaunchOps HQ database appear here automatically." />
      ) : (
        <ProjectGrid>
          {projects.map((p) => {
            const ms = milestones[p.id] || [];
            const done = ms.filter((m) => m.Status === 'Complete').length;
            const progress = ms.length ? Math.round((done / ms.length) * 100) : 0;
            const tMinus = daysUntil(p['Launch Date']);
            return (
              <ProjectCard key={p.id} onClick={() => onOpenProject(p.id)}>
                <Top>
                  <Avatar name={p.title} />
                  <StatusBadge label={p.Status || '—'} color={projectStatusColor[p.Status || ''] || '#5B6787'} />
                </Top>
                <Name>{p.title}</Name>
                <Meta>
                  {p.Industry && <span>{p.Industry}</span>}
                  {p.Industry && p['AI Persona'] && <span className="sep">/</span>}
                  {p['AI Persona'] && <span>{p['AI Persona']}</span>}
                </Meta>

                {ms.length > 0 && (
                  <ProgressRow>
                    <ProgressBar value={progress} color={progress === 100 ? theme.colors.positive : theme.colors.accent} />
                    <ProgressMeta>
                      <span>{done}/{ms.length} stages</span>
                      {tMinus !== null && tMinus > 0 && <span>{tMinus === 1 ? '1 day' : `${tMinus} days`} to launch</span>}
                    </ProgressMeta>
                  </ProgressRow>
                )}

                {p['Dashboard URL'] && (
                  <LinkRow
                    href={p['Dashboard URL']}
                    target="_blank"
                    rel="noreferrer"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <FiExternalLink size={13} /> View dashboard
                  </LinkRow>
                )}

                <Footer>
                  <Dates>
                    {p['Kickoff Date'] && <span>Kickoff {formatDate(p['Kickoff Date'])}</span>}
                    {p['Launch Date'] && <span className="launch">· Launch {formatDate(p['Launch Date'])}</span>}
                  </Dates>
                  <GoBtn>
                    <FiArrowRight />
                  </GoBtn>
                </Footer>
              </ProjectCard>
            );
          })}
        </ProjectGrid>
      )}
    </div>
  );
}

const ProjectGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 16px;
`;

const ProjectCard = styled(Card)`
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

const Top = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Name = styled.h3`
  font-size: 18px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${theme.colors.text};
`;

const Meta = styled.div`
  color: ${theme.colors.textMuted};
  font-size: 12.5px;
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  .sep { color: ${theme.colors.textFaint}; }
`;

const ProgressRow = styled.div`
  display: flex;
  flex-direction: column;
  gap: 7px;
  margin-top: 2px;
`;

const ProgressMeta = styled.div`
  display: flex;
  justify-content: space-between;
  font-family: ${theme.fonts.mono};
  font-size: 11px;
  color: ${theme.colors.textMuted};
  span:last-child { color: ${theme.colors.accent}; }
`;

const LinkRow = styled.a`
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  font-weight: 600;
  color: ${theme.colors.accent2};
  &:hover { text-decoration: underline; }
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 2px;
  padding-top: 14px;
  border-top: 1px solid ${theme.colors.borderSoft};
`;

const Dates = styled.div`
  font-size: 12px;
  color: ${theme.colors.textMuted};
  .launch { color: ${theme.colors.accent}; }
`;

const GoBtn = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 180, 58, 0.1);
  color: ${theme.colors.accent};
  border: 1px solid rgba(255, 180, 58, 0.25);
`;