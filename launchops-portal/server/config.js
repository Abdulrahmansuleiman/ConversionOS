// server/config.js
// LaunchOps portal runtime config. Secrets come from .env only.
//   NOTION_TOKEN        — Notion internal integration secret (project store)
//   PORTAL_PASSWORD     — password gate for the portal (single shared password)
//   PORTAL_PORT         — local dev port (default 4001)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load the repo-root .env (where all LaunchOps secrets live), then any local one.
dotenv({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });
dotenv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

export function resolveConfig() {
  const notionToken = (process.env.NOTION_TOKEN || '').trim();
  const portalPassword = (process.env.PORTAL_PASSWORD || '').trim();
  const port = Number.parseInt(process.env.PORTAL_PORT || '4001', 10);

  if (process.env.VERCEL === '1' && !notionToken) {
    throw new Error(
      'NOTION_TOKEN is empty — the portal backend needs it to read the project store. Set it in Vercel env vars.'
    );
  }

  return {
    notionToken,
    portalPassword,
    port: Number.isFinite(port) ? port : 4001,
  };
}