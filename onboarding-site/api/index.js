// api/index.js — Vercel serverless entry: one function for the whole backend.
import { createApp } from '../server/app.js';

const app = createApp();

export default app;