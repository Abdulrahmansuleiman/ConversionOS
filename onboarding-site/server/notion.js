// server/notion.js
// Minimal Notion API client for the LaunchOps project store.
// Database ids are bundled in notion-store.json (not secrets); the integration
// token comes from NOTION_TOKEN at runtime. All normalization happens here so
// routes never touch raw Notion property shapes.
// Reused from launchops-portal/server/notion.js. Added createRowFull() so the
// onboarding flow can capture the created project page URL (statusUrl).
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { resolveConfig } from './config.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, '..');
const NOTION_VERSION = '2025-09-03';

let _token = null;
export function token() {
  if (_token) return _token;
  _token = resolveConfig().notionToken;
  return _token;
}

let _store = null;
export function store() {
  if (_store) return _store;
  const raw = fs.readFileSync(path.join(root, 'notion-store.json'), 'utf8');
  _store = JSON.parse(raw);
  return _store;
}

export function dbId(name) {
  const id = store().databases[name];
  if (!id) throw new Error(`Unknown database "${name}" — check notion-store.json`);
  return id;
}

async function api(method, url, body, version = NOTION_VERSION) {
  const res = await fetch(url, {
    method,
    headers: {
      Authorization: `Bearer ${token()}`,
      'Notion-Version': version,
      'Content-Type': 'application/json',
    },
    body: body ? JSON.stringify(body) : undefined,
    // Fail loud instead of hanging the onboarding submit forever.
    signal: AbortSignal.timeout(15000),
  });
  const json = await res.json();
  if (!res.ok) {
    const err = new Error(json?.message || `Notion API ${res.status}`);
    err.status = res.status;
    err.code = json?.code;
    throw err;
  }
  return json;
}

const text = (v) =>
  (v?.plain_text ?? '').replace(/\n/g, ' ').trim();
const multi = (v) => (v || []).map((x) => x.plain_text).join(', ').trim();
const sel = (v) => v?.select?.name ?? null;
const num = (v) => (typeof v?.number === 'number' ? v.number : null);
const url = (v) => v?.url || null;
const date = (v) => v?.date?.start ?? null;
const chk = (v) => Boolean(v?.checkbox);
const rel = (v) =>
  (v?.relation || []).map((r) => r.id);

export function normalize(props, titleKey) {
  const title = multi(props[titleKey]?.title);
  return {
    id: props.__id,
    title,
    ...Object.fromEntries(
      Object.entries(props)
        .filter(([k]) => k !== titleKey && k !== '__id')
        .map(([k, v]) => {
          switch (v?.type) {
            case 'title':
              return [k, multi(v.title)];
            case 'rich_text':
              return [k, multi(v.rich_text)];
            case 'select':
              return [k, sel(v)];
            case 'multi_select':
              return [k, (v.multi_select || []).map((o) => o.name)];
            case 'number':
              return [k, num(v)];
            case 'url':
              return [k, url(v)];
            case 'date':
              return [k, date(v)];
            case 'checkbox':
              return [k, chk(v)];
            case 'relation':
              return [k, rel(v)];
            case 'files':
              return [
                k,
                (v.files || []).map((f) => ({
                  name: f.name || null,
                  url: f.file?.url || f.file_upload?.url || null,
                  type: f.type || 'file',
                })),
              ];
            default:
              return [k, null];
          }
        })
    ),
  };
}

export async function queryDatabase(name, { filter, sorts, pageSize = 100 } = {}) {
  const body = { page_size: pageSize };
  if (filter) body.filter = filter;
  if (sorts) body.sorts = sorts;
  // Use the backing data source id when this store has one (new API model),
  // otherwise query the classic database id directly (created with API 2022-06-28).
  const ds = store().dataSources?.[name];
  const base = ds ? `data_sources/${ds}` : `databases/${dbId(name)}`;
  // Data-source queries use the current API version; classic databases must be
  // queried with the version they were created under (2022-06-28), otherwise
  // Notion rejects the request URL.
  const version = ds ? NOTION_VERSION : '2022-06-28';
  const res = await api('POST', `https://api.notion.com/v1/${base}/query`, body, version);
  return res.results;
}

export async function listRows(name, titleKey, opts = {}) {
  const rows = await queryDatabase(name, opts);
  return rows.map((r) => normalize({ __id: r.id, ...r.properties }, titleKey));
}

export async function getRow(name, id, titleKey) {
  const res = await api('GET', `https://api.notion.com/v1/pages/${id}`);
  return normalize({ __id: res.id, ...res.properties }, titleKey);
}

export function encodeProps(props, schema) {
  const out = {};
  for (const [key, value] of Object.entries(props)) {
    const type = schema[key];
    if (!type || value === undefined || value === null) continue;
    switch (type) {
      case 'title':
        out[key] = { title: [{ type: 'text', text: { content: String(value) } }] };
        break;
      case 'rich_text':
        out[key] = { rich_text: [{ type: 'text', text: { content: String(value) } }] };
        break;
      case 'select':
        out[key] = { select: { name: String(value) } };
        break;
      case 'multi_select':
        out[key] = { multi_select: Array.isArray(value) ? value.map((n) => ({ name: String(n) })) : [] };
        break;
      case 'number':
        out[key] = { number: Number(value) };
        break;
      case 'url':
        out[key] = { url: String(value) };
        break;
      case 'date':
        out[key] = { date: { start: String(value) } };
        break;
      case 'checkbox':
        out[key] = { checkbox: Boolean(value) };
        break;
      case 'relation':
        out[key] = { relation: (Array.isArray(value) ? value : [value]).map((id) => ({ id })) };
        break;
      default:
        break;
    }
  }
  return out;
}

export async function createRow(name, props, schema) {
  const res = await api('POST', 'https://api.notion.com/v1/pages', {
    parent: { type: 'database_id', database_id: dbId(name) },
    properties: encodeProps(props, schema),
  });
  return res.id;
}

// Like createRow, but returns { id, url } so callers can link back to the
// created page (used for the onboarding project row → statusUrl).
export async function createRowFull(name, props, schema) {
  const res = await api('POST', 'https://api.notion.com/v1/pages', {
    parent: { type: 'database_id', database_id: dbId(name) },
    properties: encodeProps(props, schema),
  });
  return { id: res.id, url: res.url ?? null };
}

export async function updateRow(pageId, props, schema) {
  await api('PATCH', `https://api.notion.com/v1/pages/${pageId}`, {
    properties: encodeProps(props, schema),
  });
}

export async function health() {
  const me = await api('GET', 'https://api.notion.com/v1/users/me');
  return { bot: me.name, token: Boolean(token()) };
}

export async function lookupProjectName(projectId) {
  const p = await api('GET', `https://api.notion.com/v1/pages/${projectId}`);
  return normalize({ __id: p.id, ...p.properties }, 'Client').title || projectId;
}