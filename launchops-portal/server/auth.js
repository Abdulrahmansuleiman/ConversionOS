// server/auth.js
// Single-shared-password gate. Sets an HttpOnly, signed session cookie.
import crypto from 'node:crypto';
import { resolveConfig } from './config.js';

const COOKIE = 'lo_session';
const TTL_MS = 1000 * 60 * 60 * 24 * 14; // 14 days

function secret() {
  const pw = resolveConfig().portalPassword;
  if (!pw) throw new Error('PORTAL_PASSWORD is empty — set it in .env');
  return crypto.createHash('sha256').update(pw).digest('hex');
}

function sign(payload) {
  return crypto.createHmac('sha256', secret()).update(payload).digest('base64url');
}

function issueToken() {
  const payload = Buffer.from(JSON.stringify({ exp: Date.now() + TTL_MS })).toString('base64url');
  return `${payload}.${sign(payload)}`;
}

function verifyToken(tok) {
  if (!tok || typeof tok !== 'string') return false;
  const [payload, sig] = tok.split('.');
  if (!payload || !sig) return false;
  const expected = sign(payload);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return false;
  try {
    const { exp } = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'));
    return exp > Date.now();
  } catch {
    return false;
  }
}

export function requireAuth(req, res, next) {
  if (verifyToken(req.cookies?.[COOKIE])) return next();
  return res.status(401).json({ error: 'unauthorized' });
}

export function loginRouter(express) {
  const router = express.Router();
  router.post('/login', (req, res) => {
    const pw = req.body?.password;
    const expected = resolveConfig().portalPassword;
    if (!pw || !expected || pw !== expected) {
      return res.status(401).json({ error: 'invalid password' });
    }
    res.setHeader('Set-Cookie', [
      `${COOKIE}=${issueToken()}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${TTL_MS / 1000}`,
    ]);
    res.json({ ok: true });
  });
  router.post('/logout', (_req, res) => {
    res.setHeader('Set-Cookie', `${COOKIE}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`);
    res.json({ ok: true });
  });
  router.get('/me', (req, res) => {
    res.json({ authenticated: verifyToken(req.cookies?.[COOKIE]) });
  });
  return router;
}