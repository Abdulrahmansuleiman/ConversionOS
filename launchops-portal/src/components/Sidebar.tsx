import styled from 'styled-components';
import { FiGrid, FiFolder, FiFileText, FiMessageSquare, FiStar, FiLogOut } from 'react-icons/fi';
import { theme } from '../theme';
import type { View } from '../types';

const items: { key: View; label: string; icon: React.ComponentType; code: string }[] = [
  { key: 'overview', label: 'Overview', icon: FiGrid, code: '01' },
  { key: 'projects', label: 'Projects', icon: FiFolder, code: '02' },
  { key: 'documents', label: 'Documents', icon: FiFileText, code: '03' },
  { key: 'feedback', label: 'Feedback', icon: FiMessageSquare, code: '04' },
  { key: 'testimonials', label: 'Testimonials', icon: FiStar, code: '05' },
];

export function Sidebar({ view, onNavigate, onLogout }: { view: View; onNavigate: (v: View) => void; onLogout: () => void }) {
  return (
    <Aside>
      <Brand>
        <LogoMark>L</LogoMark>
        <div>
          <Name>LaunchOps</Name>
          <Tag>AI · OPERATIONS</Tag>
        </div>
      </Brand>

      <SectionLabel>Flight deck</SectionLabel>

      <Nav>
        {items.map((item) => {
          const Icon = item.icon as React.ComponentType<{ size?: number }>;
          const active = view === item.key;
          return (
            <NavItem key={item.key} $active={active} onClick={() => onNavigate(item.key)}>
              <Idx $active={active}>{item.code}</Idx>
              <Icon size={17} />
              {item.label}
              {active && <ActiveBar />}
            </NavItem>
          );
        })}
      </Nav>

      <Footer>
        <SysStatus>
          <span className="pulse" />
          SYSTEMS NOMINAL
        </SysStatus>
        <LogoutBtn onClick={onLogout}>
          <FiLogOut size={16} />
          Sign out
        </LogoutBtn>
      </Footer>
    </Aside>
  );
}

const Aside = styled.aside`
  width: 232px;
  flex-shrink: 0;
  min-height: 100vh;
  background: ${theme.colors.sidebarBg};
  border-right: 1px solid ${theme.colors.borderSoft};
  color: ${theme.colors.sidebarText};
  display: flex;
  flex-direction: column;
  padding: 22px 16px;
  position: sticky;
  top: 0;
  height: 100vh;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 0 8px 20px;
  border-bottom: 1px solid ${theme.colors.borderSoft};
`;

const LogoMark = styled.div`
  width: 38px;
  height: 38px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.fonts.display};
  font-weight: 700;
  font-size: 20px;
  color: #0A0E17;
  background: linear-gradient(135deg, #FFB43A, #FF8A00);
  box-shadow: 0 0 20px rgba(255, 180, 58, 0.35);
`;

const Name = styled.div`
  color: #fff;
  font-family: ${theme.fonts.display};
  font-weight: 600;
  font-size: 17px;
  letter-spacing: 0.01em;
`;

const Tag = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 9.5px;
  letter-spacing: 0.22em;
  color: ${theme.colors.textFaint};
  margin-top: 3px;
`;

const SectionLabel = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.18em;
  text-transform: uppercase;
  color: ${theme.colors.textFaint};
  padding: 18px 12px 8px;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
`;

const NavItem = styled.button<{ $active: boolean }>`
  position: relative;
  display: flex;
  align-items: center;
  gap: 11px;
  padding: 10px 12px;
  border: none;
  border-radius: 9px;
  background: ${({ $active }) => ($active ? 'rgba(255, 180, 58, 0.09)' : 'transparent')};
  color: ${({ $active }) => ($active ? '#FFE9C2' : theme.colors.sidebarText)};
  font-size: 13.5px;
  font-weight: 500;
  transition: background 0.15s ease, color 0.15s ease;
  &:hover {
    background: rgba(255, 180, 58, 0.06);
    color: #fff;
  }
`;

const Idx = styled.span<{ $active: boolean }>`
  font-family: ${theme.fonts.mono};
  font-size: 10px;
  color: ${({ $active }) => ($active ? theme.colors.accent : theme.colors.textFaint)};
  width: 14px;
`;

const ActiveBar = styled.span`
  position: absolute;
  left: -16px;
  top: 8px;
  bottom: 8px;
  width: 3px;
  border-radius: 3px;
  background: ${theme.colors.accent};
  box-shadow: 0 0 10px rgba(255, 180, 58, 0.6);
`;

const Footer = styled.div`
  border-top: 1px solid ${theme.colors.borderSoft};
  padding-top: 14px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const SysStatus = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 12px;
  font-family: ${theme.fonts.mono};
  font-size: 9.5px;
  letter-spacing: 0.14em;
  color: ${theme.colors.textFaint};
  .pulse {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: ${theme.colors.positive};
    box-shadow: 0 0 8px ${theme.colors.positive};
    animation: pulse 2.4s ease-in-out infinite;
  }
  @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
`;

const LogoutBtn = styled.button`
  display: flex;
  align-items: center;
  gap: 10px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  border-radius: 9px;
  background: transparent;
  color: ${theme.colors.sidebarText};
  font-size: 13.5px;
  &:hover { background: rgba(248, 113, 113, 0.08); color: #FCA5A5; }
`;