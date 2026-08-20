import styled from 'styled-components';
import { theme } from '../theme';
import { formatDate } from './ui';

export function Header({ title, subtitle, eyebrow }: { title: string; subtitle?: string; eyebrow?: string }) {
  return (
    <Head>
      <div>
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <Title>{title}</Title>
        {subtitle && <Sub>{subtitle}</Sub>}
      </div>
      <DateBox>
        <ClockIcon /> {formatDate(new Date().toISOString())}
      </DateBox>
    </Head>
  );
}

const Head = styled.header`
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  padding: 8px 4px 22px;
  border-bottom: 1px solid ${theme.colors.borderSoft};
  margin-bottom: 22px;
`;

const Eyebrow = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: ${theme.colors.accent};
  margin-bottom: 6px;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 600;
  letter-spacing: -0.01em;
  color: ${theme.colors.text};
`;

const Sub = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 13.5px;
  margin-top: 5px;
`;

const DateBox = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  font-family: ${theme.fonts.mono};
  font-size: 12px;
  letter-spacing: 0.04em;
  color: ${theme.colors.textMuted};
  background: ${theme.colors.surface};
  border: 1px solid ${theme.colors.border};
  padding: 8px 14px;
  border-radius: ${theme.radii.sm};
`;

function ClockIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </svg>
  );
}