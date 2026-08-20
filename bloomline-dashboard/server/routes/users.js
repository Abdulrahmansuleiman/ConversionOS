// server/routes/users.js
// GET /api/users, POST /api/users — dashboard users (Settings → Add people, §4.10).
// 400 invalid input, 409 duplicate email, 201 created.
import { Router } from 'express';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function usersRouter({ store }) {
  const router = Router();

  router.get('/api/users', async (req, res) => {
    try {
      const users = await store.users.listUsers();
      res.json(users);
    } catch (err) {
      console.error('[users] list failed:', err);
      res.status(500).json({ error: 'failed to load users' });
    }
  });

  router.post('/api/users', async (req, res) => {
    const body = req.body ?? {};
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim() : '';
    const role = typeof body.role === 'string' ? body.role.trim() : '';

    if (name === '') return res.status(400).json({ error: 'name is required' });
    if (!EMAIL_RE.test(email)) return res.status(400).json({ error: 'email must be a valid email address' });
    if (role === '') return res.status(400).json({ error: 'role is required' });

    try {
      const record = await store.users.addUser({ name, email, role });
      res.status(201).json({ user: record });
    } catch (err) {
      if (err && err.code === 'DUPLICATE_EMAIL') {
        return res.status(409).json({ error: err.message });
      }
      console.error('[users] add failed:', err);
      res.status(500).json({ error: 'failed to add user' });
    }
  });

  return router;
}
