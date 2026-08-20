import { useEffect, useState } from 'react';
import styled from 'styled-components';
import { client, login, logout } from './api/client';
import { Sidebar } from './components/Sidebar';
import { LoginScreen } from './components/LoginScreen';
import { Overview } from './views/Overview';
import { Projects } from './views/Projects';
import { ProjectDetail } from './views/ProjectDetail';
import { Documents } from './views/Documents';
import { Feedback } from './views/Feedback';
import { Testimonials } from './views/Testimonials';
import type { View } from './types';

export default function App() {
  const [authState, setAuthState] = useState<'loading' | 'authed' | 'guest'>('loading');
  const [view, setView] = useState<View>('overview');
  const [selectedProject, setSelectedProject] = useState<string | null>(null);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    client
      .get<{ authenticated: boolean }>('/api/me')
      .then((r) => setAuthState(r.authenticated ? 'authed' : 'guest'))
      .catch(() => setAuthState('guest'));
  }, []);

  const handleLogin = async (pw: string) => {
    try {
      await login(pw);
      setLoginError('');
      setAuthState('authed');
    } catch {
      setLoginError('Incorrect password. Try again.');
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      /* ignore */
    }
    setAuthState('guest');
    setView('overview');
    setSelectedProject(null);
  };

  const navigate = (v: View) => {
    setView(v);
    setSelectedProject(null);
  };

  if (authState === 'loading') return <LoginScreen onLogin={() => {}} error="Loading…" />;
  if (authState === 'guest') return <LoginScreen onLogin={handleLogin} error={loginError} />;

  return (
    <Layout>
      <Sidebar view={view} onNavigate={navigate} onLogout={handleLogout} />
      <Main>
        {selectedProject ? (
          <ProjectDetail projectId={selectedProject} onBack={() => setSelectedProject(null)} />
        ) : view === 'overview' ? (
          <Overview onOpenProject={setSelectedProject} />
        ) : view === 'projects' ? (
          <Projects onOpenProject={setSelectedProject} />
        ) : view === 'documents' ? (
          <Documents onOpenProject={setSelectedProject} />
        ) : view === 'feedback' ? (
          <Feedback onOpenProject={setSelectedProject} />
        ) : (
          <Testimonials onOpenProject={setSelectedProject} />
        )}
      </Main>
    </Layout>
  );
}

const Layout = styled.div`
  display: flex;
  min-height: 100vh;
`;

const Main = styled.main`
  flex: 1;
  padding: 28px;
  max-width: 1400px;
  min-width: 0;
  overflow-y: auto;
`;