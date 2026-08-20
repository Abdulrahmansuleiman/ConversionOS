import styled from 'styled-components';
import { theme } from '../theme';

export function LoginScreen({ onLogin, error }: { onLogin: (pw: string) => void; error?: string }) {
  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    onLogin(String(fd.get('password') || ''));
  };

  return (
    <Wrap>
      <Panel>
        <Logo>
          <LogoMark>L</LogoMark>
        </Logo>
        <Eyebrow>LAUNCHOPS AI · INTERNAL</Eyebrow>
        <Title>Mission Control</Title>
        <Sub>Client projects, roadmaps, feedback &amp; testimonials</Sub>
        <Form onSubmit={submit}>
          <Input name="password" type="password" placeholder="Portal password" autoFocus required />
          {error && <Error>{error}</Error>}
          <Button type="submit">Unlock portal</Button>
        </Form>
        <Foot>Protected · Notion-backed · LaunchOps AI</Foot>
      </Panel>
    </Wrap>
  );
}

const Wrap = styled.div`
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background:
    radial-gradient(900px 500px at 20% -10%, rgba(255, 180, 58, 0.08), transparent 60%),
    radial-gradient(900px 600px at 90% 110%, rgba(76, 201, 240, 0.08), transparent 60%),
    linear-gradient(rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    linear-gradient(90deg, rgba(148, 163, 184, 0.06) 1px, transparent 1px),
    #0A0E17;
  background-size: auto, auto, 44px 44px, 44px 44px, auto;
  padding: 24px;
`;

const Panel = styled.div`
  width: 100%;
  max-width: 380px;
  background: linear-gradient(180deg, #111A2B 0%, #0D1522 100%);
  border: 1px solid ${theme.colors.border};
  border-radius: 18px;
  box-shadow: ${theme.shadows.hover};
  padding: 42px 36px;
  text-align: center;
  position: relative;
  overflow: hidden;
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 1px;
    background: linear-gradient(90deg, transparent, rgba(255, 180, 58, 0.6), transparent);
  }
`;

const Logo = styled.div`
  display: flex;
  justify-content: center;
  margin-bottom: 22px;
`;

const LogoMark = styled.div`
  width: 52px;
  height: 52px;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-family: ${theme.fonts.display};
  font-weight: 700;
  font-size: 26px;
  color: #0A0E17;
  background: linear-gradient(135deg, #FFB43A, #FF8A00);
  box-shadow: 0 0 30px rgba(255, 180, 58, 0.4);
`;

const Eyebrow = styled.div`
  font-family: ${theme.fonts.mono};
  font-size: 10px;
  letter-spacing: 0.26em;
  color: ${theme.colors.accent};
  margin-bottom: 12px;
`;

const Title = styled.h1`
  font-size: 26px;
  font-weight: 600;
  color: ${theme.colors.text};
  letter-spacing: -0.01em;
`;

const Sub = styled.p`
  color: ${theme.colors.textMuted};
  font-size: 13.5px;
  margin-top: 8px;
  margin-bottom: 30px;
  line-height: 1.5;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 14px;
`;

const Input = styled.input`
  padding: 13px 14px;
  border: 1px solid ${theme.colors.border};
  border-radius: 10px;
  font-size: 14px;
  background: #0A0E17;
  color: ${theme.colors.text};
  outline: none;
  &:focus { border-color: ${theme.colors.accent}; box-shadow: 0 0 0 3px rgba(255,180,58,0.15); }
  &::placeholder { color: ${theme.colors.textFaint}; }
`;

const Button = styled.button`
  padding: 13px 14px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #FFB43A, #FF8A00);
  color: #0A0E17;
  font-family: ${theme.fonts.display};
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.01em;
  transition: opacity 0.15s ease, transform 0.15s ease;
  &:hover { opacity: 0.92; transform: translateY(-1px); }
`;

const Error = styled.p`
  color: ${theme.colors.negative};
  font-size: 13px;
`;

const Foot = styled.div`
  margin-top: 26px;
  font-family: ${theme.fonts.mono};
  font-size: 9.5px;
  letter-spacing: 0.16em;
  color: ${theme.colors.textFaint};
  text-transform: uppercase;
`;