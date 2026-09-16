// server/index.js — local dev runner.
import { createApp } from './app.js';
import { resolveConfig } from './config.js';

const cfg = resolveConfig();
const app = createApp();
app.listen(cfg.port, () => {
  console.log(`LaunchOps onboarding API listening on http://localhost:${cfg.port}`);
  console.log(`Health:  http://localhost:${cfg.port}/api/health`);
});