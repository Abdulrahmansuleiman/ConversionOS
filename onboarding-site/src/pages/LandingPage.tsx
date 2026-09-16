// src/pages/LandingPage.tsx — public landing (§4.1), rebranded 2026-09-16 to
// match Raymon's reference (onboarding.rjmediahub.com): centered logo, one
// centered card on a subtle fine grid, LaunchOps blue accent, gradient
// highlight on the headline's trailing word.
// Stat values render "—" until Raymon confirms real figures (BUILD_SPEC §6.2).
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { FiFileText, FiKey, FiPhone } from 'react-icons/fi';
import { Card } from '../components/Card';
import { Logo } from '../components/Logo';
import { Pill } from '../components/Pill';
import { StatCard } from '../components/StatCard';
import { copy } from '../content/copy';
import { stats } from '../content/stats';
import { theme } from '../theme';

// Icons referenced by key from copy.ts so copy stays a pure data file.
const ICON_BY_KEY = {
  document: FiFileText,
  key: FiKey,
  phone: FiPhone,
} as const;

export default function LandingPage() {
  const [before, after] = splitHeadline(copy.landing.headline, copy.landing.headlineHighlight);

  return (
    <Page>
      <Header>
        <Logo />
      </Header>
      <Main>
        <CardShell>
          <Pill>{copy.landing.eyebrow}</Pill>
          <Headline>
            {before}
            <Highlight>{after}</Highlight>
          </Headline>
          <Subcopy>{copy.landing.subcopy}</Subcopy>
          <StatsGrid>
            {stats.map((stat) => (
              <StatCard key={stat.label} stat={stat} />
            ))}
          </StatsGrid>
          <SectionTitle>{copy.landing.whatYouGetTitle}</SectionTitle>
          <List>
            {copy.landing.whatYouGet.map((item) => {
              const Icon = ICON_BY_KEY[item.icon];
              return (
                <Row key={item.icon}>
                  <IconBox $tone={item.icon}>
                    <Icon size={20} />
                  </IconBox>
                  <RowText>{item.text}</RowText>
                </Row>
              );
            })}
          </List>
          <CTA to="/onboard">{copy.landing.cta}</CTA>
        </CardShell>
      </Main>
      <Footer>{copy.landing.footer}</Footer>
    </Page>
  );
}

// Splits the headline at the highlight word (e.g. "faster.") so the trailing
// word can take the blue gradient fill. Falls back to plain render if the
// highlight string is absent from the headline (never guessed).
function splitHeadline(headline: string, highlight: string): [string, string] {
  const idx = headline.lastIndexOf(highlight);
  if (idx === -1) return [headline, ''];
  return [headline.slice(0, idx), headline.slice(idx)];
}

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${theme.colors.bg};
  background-image: linear-gradient(to right, ${theme.colors.gridLine} 1px, transparent 1px),
    linear-gradient(to bottom, ${theme.colors.gridLine} 1px, transparent 1px);
  background-size: ${theme.gridSize} ${theme.gridSize};
`;

const Header = styled.header`
  padding: 34px 24px 26px;
  display: flex;
  justify-content: center;
  align-items: center;
`;

const Main = styled.main`
  flex: 1;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: flex-start;
  padding: 0 20px 40px;
`;

const CardShell = styled(Card)`
  width: 100%;
  max-width: 700px;
  padding: 44px 44px 38px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
  text-align: center;

  @media (max-width: 560px) {
    padding: 32px 24px 28px;
  }
`;

const Headline = styled.h1`
  font-family: ${theme.fonts.display};
  font-size: clamp(30px, 5vw, 44px);
  font-weight: 700;
  line-height: 1.12;
  letter-spacing: -0.015em;
  color: ${theme.colors.text};
`;

const Highlight = styled.span`
  background: ${theme.colors.accentGradient};
  -webkit-background-clip: text;
  background-clip: text;
  -webkit-text-fill-color: transparent;
  color: transparent;
`;

const Subcopy = styled.p`
  font-size: 15px;
  line-height: 1.6;
  color: ${theme.colors.textMuted};
  max-width: 460px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  width: 100%;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const SectionTitle = styled.h2`
  font-family: ${theme.fonts.display};
  font-size: 13px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.2em;
  color: ${theme.colors.accent};
  margin-top: 6px;
`;

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 10px;
  width: 100%;
`;

const Row = styled.li`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  padding: 14px 18px;
  border-radius: ${theme.radii.md}px;
  background: ${theme.colors.accentSoft};
  border: 1px solid ${theme.colors.borderSoft};
  text-align: left;
`;

const IconBox = styled.span<{ $tone: keyof typeof ICON_BY_KEY }>`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  color: ${({ $tone }) => ($tone === 'phone' ? theme.colors.iconPhone : theme.colors.iconDoc)};
`;

const RowText = styled.span`
  font-size: 15px;
  line-height: 1.45;
  color: ${theme.colors.textMuted};
`;

const CTA = styled(Link)`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 16px 24px;
  border-radius: ${theme.radii.md}px;
  background: ${theme.colors.accent};
  color: #fff;
  font-family: ${theme.fonts.display};
  font-size: 15px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  transition: background 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    background: ${theme.colors.accentHover};
    box-shadow: ${theme.shadows.glow};
    transform: translateY(-1px);
  }
`;

const Footer = styled.footer`
  padding: 20px 24px 28px;
  font-size: 12px;
  letter-spacing: 0.02em;
  color: ${theme.colors.textFaint};
`;