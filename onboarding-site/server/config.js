// server/config.js
// LaunchOps onboarding site runtime config. Secrets come from .env only.
//   NOTION_TOKEN        — Notion internal integration secret (project store)
//   ONBOARDING_PORT     — local dev port (default 4100)
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as dotenv } from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Load the repo-root .env (where all LaunchOps secrets live), then any local one.
dotenv({ path: path.resolve(__dirname, '..', '..', '.env'), quiet: true });
dotenv({ path: path.resolve(__dirname, '..', '.env'), quiet: true });

export function resolveConfig() {
  const notionToken = (process.env.NOTION_TOKEN || '').trim();
  const port = Number.parseInt(process.env.ONBOARDING_PORT || '4100', 10);

  if (process.env.VERCEL === '1' && !notionToken) {
    throw new Error(
      'NOTION_TOKEN is empty — the onboarding site backend needs it to write to the project store. Set it in Vercel env vars.'
    );
  }

  return {
    notionToken,
    port: Number.isFinite(port) ? port : 4100,
  };
}