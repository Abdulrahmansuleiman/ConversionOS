// server/adapters/local-file.js
// LocalFileAdapter — dev-only fallback persistence to ./data/*.json (spec §4.4).
// - Writes are atomic: write to *.tmp then rename over the target.
// - Reads re-read from disk on every call (no stale in-memory cache) — so a
//   concurrently running `npm run seed` shows up without a server restart.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '..', '..', 'data');
const EVENTS_FILE = path.join(DATA_DIR, 'events.json');
const USERS_FILE = path.join(DATA_DIR, 'users.json');

export class DuplicateEmailError extends Error {
  constructor(message) {
    super(message);
    this.name = 'DuplicateEmailError';
    this.code = 'DUPLICATE_EMAIL';
  }
}

function ensureDataDir() {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function readJson(file, fallback) {
  if (!fs.existsSync(file)) return fallback;
  const raw = fs.readFileSync(file, 'utf8');
  if (!raw.trim()) return fallback;
  try {
    return JSON.parse(raw);
  } catch (err) {
    // Fail loud: a corrupt store must never silently read as an empty one.
    throw new Error(`LocalFileAdapter: failed to parse ${file}: ${err.message}`);
  }
}

function atomicWrite(file, data) {
  ensureDataDir();
  const tmp = `${file}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), 'utf8');
  fs.renameSync(tmp, file);
}

export function createLocalFileAdapter() {
  return {
    // ---- EventStore (spec §4.4) ----
    async saveEvent({ event_type, client_id, timestamp, payload }) {
      ensureDataDir();
      const events = readJson(EVENTS_FILE, []);
      const id = events.length ? Math.max(...events.map((e) => e.id)) + 1 : 1;
      const record = {
        id,
        event_type,
        client_id,
        timestamp: new Date(timestamp || Date.now()).toISOString(),
        payload: payload ?? {},
      };
      events.push(record);
      atomicWrite(EVENTS_FILE, events);
      return record;
    },

    async listEvents({ eventTypes, from, to, clientId } = {}) {
      const events = readJson(EVENTS_FILE, []);
      return events.filter((e) => {
        if (eventTypes && eventTypes.length > 0 && !eventTypes.includes(e.event_type)) return false;
        if (clientId && e.client_id !== clientId) return false;
        const ts = Date.parse(e.timestamp);
        if (from && ts < Date.parse(from)) return false; // inclusive from
        if (to && ts >= Date.parse(to)) return false; // exclusive to
        return true;
      });
    },

    // ---- UserStore (spec §4.4) ----
    async listUsers() {
      return readJson(USERS_FILE, []);
    },

    async addUser({ name, email, role }) {
      const users = readJson(USERS_FILE, []);
      const existing = users.find((u) => u.email.toLowerCase() === email.toLowerCase());
      if (existing) {
        throw new DuplicateEmailError(`A person with email ${email} already exists.`);
      }
      const record = {
        id: crypto.randomUUID(),
        name,
        email,
        role,
        created_at: new Date().toISOString(),
      };
      users.push(record);
      atomicWrite(USERS_FILE, users);
      return record;
    },
  };
}
