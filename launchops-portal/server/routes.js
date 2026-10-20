// server/routes.js
// All portal data endpoints. Every read goes to Notion (server-side token only).
import express from 'express';
import * as n from './notion.js';
import { DB } from './schemas.js';
import { deriveProjectStatus } from './status.js';

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

  // --- Status self-heal ----------------------------------------------------
  // Projects.Status and milestone Status are independent Notion fields, so
  // they can drift ("In Discovery" + every milestone Complete). The effective
  // status is always derived from the milestones (advance-only, see
  // status.js) and, when it differs from what's stored, we write it back so
  // the Notion store heals itself too.
  async function withDerivedStatus(project, milestones) {
    const derived = deriveProjectStatus(project.Status, milestones);
    if (!derived || derived === project.Status) return project; // no opinion / already right → no write
    try {
      await n.updateRow(project.id, { Status: derived }, DB.Projects.props);
      console.log(`[status] healed ${project.id} "${project.title}": ${project.Status} -> ${derived}`);
    } catch (e) {
      // A read must never fail because the write-back failed — the API answer
      // is correct either way (the next read retries the heal).
      console.error(`[status] heal failed ${project.id}: ${e.message}`);
    }
    return { ...project, Status: derived };
  }

  // Re-derive one project's Status from its own roadmap, right now, and write
  // it back. Called on every milestone write so the project row is correct the
  // instant a stage is marked Complete — it does not depend on the client
  // refetching, on a later read, or on anyone remembering to set the select.
  async function syncProjectStatus(projectId) {
    try {
      const [project, milestones] = await Promise.all([
        n.getRow('Projects', projectId, DB.Projects.titleKey),
        n.listRows('Roadmap', DB.Roadmap.titleKey, {
          filter: { property: 'Project', relation: { contains: projectId } },
        }),
      ]);
      return await withDerivedStatus(project, milestones);
    } catch (e) {
      console.error(`[status] sync failed for project ${projectId}: ${e.message}`);
      return null;
    }
  }

  async function syncProjectsForMilestone(milestone) {
    const ids = [...new Set(milestone?.Project || [])];
    const synced = await Promise.all(ids.map((id) => syncProjectStatus(id)));
    return synced
      .filter(Boolean)
      .map((p) => ({ id: p.id, title: p.title, Status: p.Status }));
  }

  async function listProjectsWithStatus(projectOpts = {}) {
    const [projects, milestones] = await Promise.all([
      n.listRows('Projects', DB.Projects.titleKey, projectOpts),
      n.listRows('Roadmap', DB.Roadmap.titleKey),
    ]);
    const byProject = new Map();
    for (const m of milestones) {
      for (const pid of m.Project || []) {
        if (!byProject.has(pid)) byProject.set(pid, []);
        byProject.get(pid).push(m);
      }
    }
    return Promise.all(projects.map((p) => withDerivedStatus(p, byProject.get(p.id) || [])));
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
        listProjectsWithStatus(),
        n.listFeedback(),
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
          .map((f) => ({ id: f.id, title: f.title, rating: f.Rating, submitted: f.Submitted, projectId: f.projectId })),
      });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  // --- Status reconcile ----------------------------------------------------
  // Heal every project's Status from its roadmap in one call. Safe to run any
  // time, idempotent, and it is exactly what the portal shows. Used after a
  // deploy and as the recovery path if a row is ever hand-edited in Notion.
  const reconcileAll = async () => {
    const rows = await listProjectsWithStatus();
    return rows.map((p) => ({ id: p.id, title: p.title, Status: p.Status }));
  };

  r.post('/status/reconcile', async (_req, res) => {
    try {
      res.json({ ok: true, projects: await reconcileAll() });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  r.get('/status/reconcile', async (_req, res) => {
    try {
      res.json({ ok: true, projects: await reconcileAll() });
    } catch (e) {
      res.status(500).json({ ok: false, error: e.message });
    }
  });

  // --- Projects ---
  r.get('/projects', async (_req, res) => {
    try {
      const rows = await listProjectsWithStatus({
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
        // Feedback is matched on the *resolved* project (form submissions have no
        // Project relation — they're attributed by Business Name).
        n.listFeedback({ projectId: req.params.id }),
      ]);
      res.json({
        project: await withDerivedStatus(project, milestones),
        milestones: sortByPhase(milestones),
        assets,
        feedback,
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
      // A newly created (already-complete) stage must move the project too.
      const row = await n.getRow('Roadmap', id, DB.Roadmap.titleKey);
      const projects = await syncProjectsForMilestone(row);
      res.status(201).json({ ok: true, id, projects });
    } catch (e) {
      res.status(500).json({ error: e.message });
    }
  });

  r.patch('/milestones/:id', async (req, res) => {
    try {
      await n.updateRow(req.params.id, req.body, DB.Roadmap.props);
      // Re-derive the parent project's Status immediately. The response carries
      // it back so the client can show the new status without a refetch, and
      // the same write is what keeps Notion correct.
      const row = await n.getRow('Roadmap', req.params.id, DB.Roadmap.titleKey);
      const projects = await syncProjectsForMilestone(row);
      res.json({ ok: true, id: req.params.id, projects });
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
      res.json(await n.listFeedback({ projectId: req.query.project_id }));
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