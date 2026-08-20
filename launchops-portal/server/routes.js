// server/routes.js
// All portal data endpoints. Every read goes to Notion (server-side token only).
import express from 'express';
import * as n from './notion.js';
import { DB } from './schemas.js';

export function buildRoutes() {
  const r = express.Router();

  const PHASE_ORDER = ['Kickoff', 'Design', 'Build', 'Review', 'Launch', 'Post-launch support'];
  const sortByPhase = (rows) =>
    [...rows].sort(
      (a, b) => PHASE_ORDER.indexOf(a.Phase ?? '') - PHASE_ORDER.indexOf(b.Phase ?? '') || (a.DueDate ?? '').localeCompare(b.DueDate ?? '')
    );

  async function projectNameMap() {
    const projects = await n.listRows('Projects', DB.Projects.titleKey);
    return new Map(projects.map((p) => [p.id, p.title]));
  }

  // --- Health ---
  r.get('/health', async (_req, res) => {
    try {
      const h = await n.health();
      res.json({ ok: true, mode: 'notion', bot: h.bot });
    } catch (e) {
      res.status(503).json({ ok: false, error: e.message });
    }
  });

  // --- Overview ---
  r.get('/overview', async (_req, res) => {
    try {
      const [projects, feedback] = await Promise.all([
        n.listRows('Projects', DB.Projects.titleKey),
        n.listRows('Client Feedback', DB['Client Feedback'].titleKey),
      ]);
      const active = projects.filter((p) => !['Completed', 'In Discovery'].includes(p.Status ?? ''));
      const live = projects.filter((p) => p.Status === 'Live' || (p.Status === 'Completed' && p.DashboardURL));
      const ratings = feedback.map((f) => f.Rating).filter((x) => typeof x === 'number');
      const statusBreakdown = projects.reduce((acc, p) => {
        const s = p.Status || 'Unknown';
        acc[s] = (acc[s] || 0) + 1;
        return acc;
      }, {});
      res.json({
        totalProjects: projects.length,
        activeProjects: active.length,
        liveDashboards: live.length,
        feedbackCount: feedback.length,
        avgRating: ratings.length ? ratings.reduce((a, b) => a + b, 0) / ratings.length : null,
        statusBreakdown,
        launches: projects
          .map((p) => ({ title: p.title, launchDate: p['Launch Date'], status: p.Status, dashboardUrl: p['Dashboard URL'] }))
          .filter((p) => p.launchDate),
        recentFeedback: [...feedback]
          .sort((a, b) => String(b.Submitted ?? '').localeCompare(String(a.Submitted ?? '')))
          .slice(0, 5)
          .map((f) => ({ id: f.id, title: f.title, rating: f.Rating, submitted: f.Submitted, projectId: f.Project?.[0] })),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Projects ---
  r.get('/projects', async (_req, res) => {
    try {
      const rows = await n.listRows('Projects', DB.Projects.titleKey, {
        sorts: [{ property: 'Client', direction: 'ascending' }],
      });
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.get('/projects/:id', async (req, res) => {
    try {
      const [project, milestones, assets, feedback] = await Promise.all([
        n.getRow('Projects', req.params.id, DB.Projects.titleKey),
        n.listRows('Roadmap', DB.Roadmap.titleKey, {
          filter: { property: 'Project', relation: { contains: req.params.id } },
        }),
        n.listRows('Build Assets', DB['Build Assets'].titleKey, {
          filter: { property: 'Project', relation: { contains: req.params.id } },
        }),
        n.listRows('Client Feedback', DB['Client Feedback'].titleKey, {
          filter: { property: 'Project', relation: { contains: req.params.id } },
        }),
      ]);
      res.json({
        project,
        milestones: sortByPhase(milestones),
        assets,
        feedback: [...feedback].sort((a, b) => String(b.Submitted ?? '').localeCompare(String(a.Submitted ?? ''))),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/projects', async (req, res) => {
    try {
      const id = await n.createRow('Projects', req.body, DB.Projects.props);
      const row = await n.getRow('Projects', id, DB.Projects.titleKey);
      res.status(201).json(row);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.patch('/projects/:id', async (req, res) => {
    try {
      await n.updateRow(req.params.id, req.body, DB.Projects.props);
      res.json({ ok: true, id: req.params.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Roadmap ---
  r.get('/milestones', async (req, res) => {
    try {
      const opts = req.query.project_id
        ? { filter: { property: 'Project', relation: { contains: req.query.project_id } } }
        : {};
      const rows = await n.listRows('Roadmap', DB.Roadmap.titleKey, opts);
      res.json(sortByPhase(rows));
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/milestones', async (req, res) => {
    try {
      const id = await n.createRow('Roadmap', req.body, DB.Roadmap.props);
      res.status(201).json({ ok: true, id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.patch('/milestones/:id', async (req, res) => {
    try {
      await n.updateRow(req.params.id, req.body, DB.Roadmap.props);
      res.json({ ok: true, id: req.params.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Build Assets ---
  r.get('/assets', async (req, res) => {
    try {
      const opts = req.query.project_id
        ? { filter: { property: 'Project', relation: { contains: req.query.project_id } } }
        : {};
      const rows = await n.listRows('Build Assets', DB['Build Assets'].titleKey, opts);
      res.json(rows);
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/assets', async (req, res) => {
    try {
      const id = await n.createRow('Build Assets', req.body, DB['Build Assets'].props);
      res.status(201).json({ ok: true, id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.patch('/assets/:id', async (req, res) => {
    try {
      await n.updateRow(req.params.id, req.body, DB['Build Assets'].props);
      res.json({ ok: true, id: req.params.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Client Feedback ---
  r.get('/feedback', async (req, res) => {
    try {
      const filter = req.query.project_id
        ? { property: 'Project', relation: { contains: req.query.project_id } }
        : undefined;
      const rows = await n.listRows('Client Feedback', DB['Client Feedback'].titleKey, filter ? { filter } : {});
      const names = await projectNameMap();
      res.json(
        rows
          .sort((a, b) => String(b.Submitted ?? '').localeCompare(String(a.Submitted ?? '')))
          .map((f) => ({ ...f, projectName: f.Project?.[0] ? names.get(f.Project[0]) || f.Project[0] : null }))
      );
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/feedback', async (req, res) => {
    try {
      const id = await n.createRow('Client Feedback', req.body, DB['Client Feedback'].props);
      res.status(201).json({ ok: true, id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.patch('/feedback/:id', async (req, res) => {
    try {
      await n.updateRow(req.params.id, req.body, DB['Client Feedback'].props);
      res.json({ ok: true, id: req.params.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Testimonials ---
  r.get('/testimonials', async (req, res) => {
    try {
      const all = req.query.all === '1';
      const rows = await n.listRows('Testimonials', DB.Testimonials.titleKey, {
        filter: all ? undefined : { property: 'Approved', checkbox: { equals: true } },
      });
      const names = await projectNameMap();
      res.json(
        rows
          .sort((a, b) => String(b.Date ?? '').localeCompare(String(a.Date ?? '')))
          .map((t) => ({ ...t, projectName: t.Project?.[0] ? names.get(t.Project[0]) || t.Project[0] : null }))
      );
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.post('/testimonials', async (req, res) => {
    try {
      const id = await n.createRow('Testimonials', req.body, DB.Testimonials.props);
      res.status(201).json({ ok: true, id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.patch('/testimonials/:id', async (req, res) => {
    try {
      await n.updateRow(req.params.id, req.body, DB.Testimonials.props);
      res.json({ ok: true, id: req.params.id });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Client Documents ---
  r.get('/documents', async (req, res) => {
    try {
      const filter = req.query.project_id
        ? { property: 'Client', relation: { contains: req.query.project_id } }
        : undefined;
      const rows = await n.listRows('Client Documents', DB['Client Documents'].titleKey, filter ? { filter } : {});
      const names = await projectNameMap();
      res.json(
        rows
          .sort((a, b) => String(b['Document Date'] ?? '').localeCompare(String(a['Document Date'] ?? '')))
          .map((d) => ({
            ...d,
            projectName: d.Client?.[0] ? names.get(d.Client[0]) || d.Client[0] : null,
            file: d.File?.[0] || null,
          }))
      );
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  return r;
}