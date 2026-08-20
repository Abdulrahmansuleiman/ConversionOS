// server/config.js
// Resolves runtime configuration from .env per the spec §4.5 mode matrix.
//
//   | SUPABASE_URL | SUPABASE_SERVICE_ROLE_KEY | Mode         | Behavior                          |
//   |--------------|----------------------------|--------------|-----------------------------------|
//   | empty        | anything                   | local-file   | LocalFileAdapter + loud banner    |
//   | set          | set                        | supabase     | SupabaseAdapter, no banner        |
//   | set          | empty                      | startup ERROR| refuse to start (fail loud)       |
import 'dotenv/config';

const SUPABASE_URL = (process.env.SUPABASE_URL || '').trim();
const SUPABASE_SERVICE_ROLE_KEY = (process.env.SUPABASE_SERVICE_ROLE_KEY || '').trim();
const GHL_WEBHOOK_SECRET = (process.env.GHL_WEBHOOK_SECRET || '').trim();
const WEBHOOK_PORT = Number.parseInt(process.env.WEBHOOK_PORT || '4001', 10);

export function resolveConfig() {
  let mode;
  if (!SUPABASE_URL) {
    mode = 'local-file';
  } else if (SUPABASE_SERVICE_ROLE_KEY) {
    mode = 'supabase';
  } else {
    throw new Error(
      'SUPABASE_URL is set but SUPABASE_SERVICE_ROLE_KEY is empty — set both keys or remove SUPABASE_URL to use local dev mode.'
    );
  }

  return {
    mode,
    supabaseUrl: SUPABASE_URL,
    supabaseServiceRoleKey: SUPABASE_SERVICE_ROLE_KEY,
    webhookSecret: GHL_WEBHOOK_SECRET || null,
    webhookPort: Number.isFinite(WEBHOOK_PORT) ? WEBHOOK_PORT : 4001,
  };
}
