// src/components/Sidebar.tsx — 220px dark-gradient sidebar (spec §1.2/§3.3):
// logo + company name, the 7 nav tabs, user profile + LaunchOps AI footer.
import styled from 'styled-components';
import type { IconType } from 'react-icons';
import {
  TbBell,
  TbCalendar,
  TbCalendarEvent,
  TbLayoutDashboard,
  TbMessageCircle,
  TbSettings,
  TbUserPlus,
  TbUsers,
} from 'react-icons/tb';

export type TabId =
  | 'overview'
  | 'bookings'
  | 'conversations'
  | 'followups'
  | 'transfers'
  | 'calendar'
  | 'settings';

const NAV_ITEMS: { id: TabId; label: string; icon: IconType }[] = [
  { id: 'overview', label: 'Overview', icon: TbLayoutDashboard },
  { id: 'bookings', label: 'Bookings', icon: TbCalendarEvent },
  { id: 'conversations', label: 'Conversations', icon: TbMessageCircle },
  { id: 'followups', label: 'Follow-ups', icon: TbBell },
  { id: 'transfers', label: 'Human transfers', icon: TbUserPlus },
  { id: 'calendar', label: 'Calendar', icon: TbCalendar },
  { id: 'settings', label: 'Settings', icon: TbSettings },
];

interface SidebarProps {
  active: TabId;
  onSelect: (id: TabId) => void;
}

const Aside = styled.aside`
  position: fixed;
  inset: 0 auto 0 0;
  width: ${(p) => p.theme.layout.sidebarWidth};
  height: 100vh;
  background: ${(p) => p.theme.colors.sidebarGradient};
  display: flex;
  flex-direction: column;
  z-index: 10;
`;

const Brand = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 22px 18px 18px;
`;

const BrandName = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const Company = styled.div`
  color: ${(p) => p.theme.colors.sidebarTextActive};
  font-weight: 700;
  font-size: 14.5px;
  letter-spacing: -0.01em;
  white-space: nowrap;
`;

const BuiltBy = styled.div`
  color: ${(p) => p.theme.colors.sidebarText};
  font-size: 10.5px;
  opacity: 0.75;
  letter-spacing: 0.02em;
`;

const Nav = styled.nav`
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px 10px;
  flex: 1;
  overflow-y: auto;
`;

const NavButton = styled.button<{ $active: boolean }>`
  display: flex;
  align-items: center;
  gap: 11px;
  width: 100%;
  border: none;
  background: ${(p) => (p.$active ? p.theme.colors.sidebarActiveBg : 'transparent')};
  color: ${(p) => (p.$active ? p.theme.colors.sidebarTextActive : p.theme.colors.sidebarText)};
  font-size: 13.5px;
  font-weight: 600;
  padding: 10px 12px;
  border-radius: 9px;
  cursor: pointer;
  text-align: left;
  position: relative;
  transition: background 0.15s ease, color 0.15s ease;

  &::before {
    content: '';
    position: absolute;
    left: -10px;
    top: 8px;
    bottom: 8px;
    width: 3px;
    border-radius: 0 3px 3px 0;
    background: ${(p) => (p.$active ? p.theme.colors.sidebarActiveBar : 'transparent')};
  }

  svg {
    font-size: 17px;
    flex-shrink: 0;
  }

  &:hover {
    color: ${(p) => p.theme.colors.sidebarTextActive};
  }
`;

const Profile = styled.div`
  border-top: 1px solid rgba(255, 255, 255, 0.07);
  padding: 14px 18px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const Avatar = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: ${(p) => p.theme.colors.accentGradient};
  color: #fff;
  font-size: 12px;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
`;

const ProfileMeta = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;
`;

const ProfileName = styled.div`
  color: ${(p) => p.theme.colors.sidebarTextActive};
  font-size: 12.5px;
  font-weight: 600;
  white-space: nowrap;
`;

const ProfileRole = styled.div`
  color: ${(p) => p.theme.colors.sidebarText};
  font-size: 11px;
  opacity: 0.8;
`;

export function BloomMark() {
  return (
    <svg width="34" height="34" viewBox="0 0 32 32" aria-hidden="true">
      <defs>
        <linearGradient id="bloomMark" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#34d399" />
          <stop offset="1" stopColor="#16a34a" />
        </linearGradient>
      </defs>
      <rect width="32" height="32" rx="8" fill="url(#bloomMark)" />
      <g fill="#fff">
        <circle cx="16" cy="11" r="4" />
        <circle cx="11.4" cy="15.2" r="4" />
        <circle cx="20.6" cy="15.2" r="4" />
        <circle cx="16" cy="20" r="2.8" />
      </g>
    </svg>
  );
}

export function Sidebar({ active, onSelect }: SidebarProps) {
  return (
    <Aside>
      <Brand>
        <BloomMark />
        <BrandName>
          <Company>Bloomline Apparel</Company>
          <BuiltBy>Built by LaunchOps AI</BuiltBy>
        </BrandName>
      </Brand>
      <Nav aria-label="Dashboard sections">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <NavButton
              key={item.id}
              $active={active === item.id}
              onClick={() => onSelect(item.id)}
              aria-current={active === item.id ? 'page' : undefined}
            >
              <Icon aria-hidden="true" />
              {item.label}
            </NavButton>
          );
        })}
      </Nav>
      <Profile>
        <Avatar>LO</Avatar>
        <ProfileMeta>
          <ProfileName>LaunchOps AI</ProfileName>
          <ProfileRole>Platform Admin</ProfileRole>
        </ProfileMeta>
        <TbUsers style={{ marginLeft: 'auto', color: '#b7b0c4', fontSize: 15 }} aria-hidden="true" />
      </Profile>
    </Aside>
  );
}
