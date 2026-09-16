// src/pages/LandingPage.tsx — public landing (§4.1).
// Stat values render "—" until Raymon confirms real figures (BUILD_SPEC §6.2).
import { Link } from 'react-router-dom';
import styled from 'styled-components';
import { Card } from '../components/Card';
import { Logo } from '../components/Logo';
import { Pill } from '../components/Pill';
import { StatCard } from '../components/StatCard';
import { copy } from '../content/copy';
import { stats } from '../content/stats';
import { theme } from '../theme';

export default function LandingPage() {
  return (
    <Page>
      <Header>
        <Logo />
      </Header>
      <Hero>
        <Pill>{copy.landing.eyebrow}</Pill>
        <Headline>{copy.landing.headline}</Headline>
        <Subcopy>{copy.landing.subcopy}</Subcopy>
        <StatsGrid>
          {stats.map((stat) => (
            <StatCard key={stat.label} stat={stat} />
          ))}
        </StatsGrid>
        <Section>
          <SectionTitle>{copy.landing.whatYouGetTitle}</SectionTitle>
          <List>
            {copy.landing.whatYouGet.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </List>
        </Section>
        <CTA to="/onboard">{copy.landing.cta}</CTA>
      </Hero>
      <Footer>{copy.landing.footer}</Footer>
    </Page>
  );
}

const Page = styled.div`
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  align-items: center;
`;

const Header = styled.header`
  width: 100%;
  max-width: 1080px;
  padding: 26px 24px;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Hero = styled.main`
  flex: 1;
  max-width: 880px;
  width: 100%;
  padding: 48px 24px 64px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 28px;
`;

const Headline = styled.h1`
  font-family: ${theme.fonts.display};
  font-size: clamp(44px, 6vw, 64px);
  font-weight: 700;
  line-height: 1.05;
  color: ${theme.colors.text};
  letter-spacing: -0.02em;
  max-width: 720px;
`;

const Subcopy = styled.p`
  font-size: 17px;
  line-height: 1.6;
  color: ${theme.colors.textMuted};
  max-width: 560px;
`;

const StatsGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
  width: 100%;
  max-width: 660px;

  @media (max-width: 640px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled(Card)`
  width: 100%;
  max-width: 660px;
  text-align: left;
`;

const SectionTitle = styled.h2`
  font-family: ${theme.fonts.display};
  font-size: 20px;
  font-weight: 600;
  color: ${theme.colors.text};
  margin-bottom: 16px;
`;

const List = styled.ul`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 12px;
  font-size: 15px;
  color: ${theme.colors.text};
`;

const CTA = styled(Link)`
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 15px 30px;
  border-radius: ${theme.radii.md}px;
  background: ${theme.colors.accent};
  color: #0a0e17;
  font-family: ${theme.fonts.display};
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: box-shadow 0.18s ease, transform 0.18s ease;

  &:hover {
    box-shadow: ${theme.shadows.hover};
    transform: translateY(-1px);
  }
`;

const Footer = styled.footer`
  padding: 24px;
  font-size: 12px;
  color: ${theme.colors.textFaint};
`;