// server/routes.js
// Public onboarding site endpoints: health, onboard submission, status lookup.
// No auth — this site is client-facing by design.
import express from 'express';
import * as n from './notion.js';
import { createProjectWithRoadmap, findLatestProjectBySlug, validateOnboardPayload } from './onboarding.js';

export function buildRoutes() {
  const r = express.Router();

  // --- Health (mirrors app.js /api/health) ---
  r.get('/health', async (_req, res) => {
    try {
      const h = await n.health();
      res.json({ ok: true, mode: 'notion', bot: h.bot });
    } catch (e) {
      res.status(503).json({ ok: false, error: e.message });
    }
  });

  // --- Submit onboarding (§5.2) ---
  r.post('/onboard', async (req, res) => {
    try {
      const { error, fields } = validateOnboardPayload(req.body);
      if (error) {
        return res.status(400).json({ ok: false, error, fields });
      }
      const { projectId, clientSlug, clientName } = await createProjectWithRoadmap(req.body);
      return res.status(201).json({
        ok: true,
        projectId,
        clientSlug,
        statusUrl: `/status/${clientSlug}`,
        projectName: clientName,
      });
    } catch (e) {
      const partialProjectId = e.partialProjectId;
      const payload = { ok: false, error: e.message };
      if (partialProjectId) payload.partialProjectId = partialProjectId;
      return res.status(500).json(payload);
    }
  });

  // --- Client status lookup (§5.5) ---
  r.get('/status/:clientSlug', async (req, res) => {
    try {
      const found = await findLatestProjectBySlug(req.params.clientSlug);
      if (!found) {
        return res.status(404).json({ ok: false, error: 'Onboarding not found for this link.' });
      }
      const p = found.project;
      return res.json({
        ok: true,
        project: {
          id: p.id,
          client: p.title,
          status: p.Status ?? null,
          industry: p.Industry ?? null,
          aiPersona: p['AI Persona'] ?? null,
          notes: p.Notes ?? null,
          createdAt: p.createdAt,
        },
        milestones: found.milestones.map((m) => ({
          id: m.id,
          milestone: m.title,
          phase: m.Phase ?? null,
          status: m.Status ?? null,
        })),
      });
    } catch (e) {
      return res.status(500).json({ ok: false, error: e.message });
    }
  });

  // --- Deferred: Client Feedback form creation (see BUILD_SPEC §8.3.5) ---
  r.post('/onboard/:projectId/feedback-form', (_req, res) => {
    res.status(501).json({ ok: false, error: 'not implemented — see BUILD_SPEC §8.3.5' });
  });

  return r;
}