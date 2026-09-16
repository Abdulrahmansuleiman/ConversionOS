// src/components/Logo.tsx — launchops.svg mark + "LAUNCHOPS" wordmark.
// Variant chosen: amber dot after the word (minimal; BUILD_SPEC §3).
// The SVG mark itself is reused as-is (purple/indigo — see BUILD_SPEC §8.3.6).
import styled from 'styled-components';
import { theme } from '../theme';

export function Logo({ suffix }: { suffix?: string }) {
  return (
    <Wrap>
      <Mark src="/launchops.svg" alt="LaunchOps" />
      <Wordmark>
        LAUNCHOPS
        <Dot />
        {suffix ? <Suffix>{suffix}</Suffix> : null}
      </Wordmark>
    </Wrap>
  );
}

const Wrap = styled.div`
  display: inline-flex;
  align-items: center;
  gap: 12px;
`;

const Mark = styled.img`
  width: 32px;
  height: 32px;
  border-radius: 8px;
`;

const Wordmark = styled.span`
  font-family: ${theme.fonts.display};
  font-size: 18px;
  font-weight: 600;
  letter-spacing: 0.12em;
  color: ${theme.colors.text};
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
`;

const Dot = styled.span`
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: ${theme.colors.accent};
  box-shadow: 0 0 8px ${theme.colors.accent};
  align-self: center;
`;

const Suffix = styled.span`
  font-family: ${theme.fonts.body};
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 0.04em;
  color: ${theme.colors.textMuted};
  margin-left: 4px;
`;