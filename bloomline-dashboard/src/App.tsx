// src/App.tsx — Sidebar + MainArea (margin-left: 220px) + tab router
// (spec §3.3). Each tab is wrapped in its own ErrorBoundary so one broken tab
// never blanks the whole app (§5.3).
import { useState } from 'react';
import styled from 'styled-components';
import { Sidebar, type TabId } from './components/Sidebar';
import { Header } from './components/Header';
import { ErrorBoundary } from './components/ErrorBoundary';
import { DashboardTab } from './tabs/DashboardTab';
import { BookingsTab } from './tabs/BookingsTab';
import { ConversationsTab } from './tabs/ConversationsTab';
import { FollowUpsTab } from './tabs/FollowUpsTab';
import { HumanTransfersTab } from './tabs/HumanTransfersTab';
import { CalendarTab } from './tabs/CalendarTab';
import { SettingsTab } from './tabs/SettingsTab';

const MainArea = styled.div`
  margin-left: ${(p) => p.theme.layout.sidebarWidth};
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  padding: ${(p) => p.theme.layout.contentPaddingVert} ${(p) => p.theme.layout.contentPaddingSides};
`;

const Content = styled.main`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 24px;
`;

export default function App() {
  const [active, setActive] = useState<TabId>('overview');

  const renderTab = () => {
    switch (active) {
      case 'overview':
        return <DashboardTab />;
      case 'bookings':
        return <BookingsTab />;
      case 'conversations':
        return <ConversationsTab />;
      case 'followups':
        return <FollowUpsTab />;
      case 'transfers':
        return <HumanTransfersTab />;
      case 'calendar':
        return <CalendarTab />;
      case 'settings':
        return <SettingsTab />;
      default:
        return <DashboardTab />;
    }
  };

  return (
    <>
      <Sidebar active={active} onSelect={setActive} />
      <MainArea>
        <Header />
        <Content>
          <ErrorBoundary key={active}>{renderTab()}</ErrorBoundary>
        </Content>
      </MainArea>
    </>
  );
}
