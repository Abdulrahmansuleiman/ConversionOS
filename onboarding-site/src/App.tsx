import { Link, Route, Routes } from 'react-router-dom';
import styled from 'styled-components';
import LandingPage from './pages/LandingPage';
import OnboardPage from './pages/OnboardPage';
import StatusPage from './pages/StatusPage';
import { theme } from './theme';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/onboard" element={<OnboardPage />} />
      <Route path="/status/:clientSlug" element={<StatusPage />} />
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}

// §4.4 — minimal 404 page: nothing invented, no fake links.
function NotFoundPage() {
  return (
    <Shell>
      <Card>
        <Title>Page not found.</Title>
        <HomeLink to="/">Back to home</HomeLink>
      </Card>
    </Shell>
  );
}

const Shell = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 24px;
`;

const Card = styled.div`
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  border-radius: ${theme.radii.lg}px;
  box-shadow: ${theme.shadows.card};
  padding: 40px;
  text-align: center;
  max-width: 420px;
`;

const Title = styled.h1`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 16px;
`;

const HomeLink = styled(Link)`
  color: ${theme.colors.accent};
  font-weight: 600;
  &:hover {
    text-decoration: underline;
  }
`;