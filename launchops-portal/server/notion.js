// server/notion.js
// Minimal Notion API client for the LaunchOps project store.
// Database ids are bundled in notion-store.json (not secrets); the integration
// token comes from NOTION_TOKEN at runtime. All normalization happens here so
// routes never touch raw Notion property shapes.
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
    createdTime: props.__created_time ?? null,
    ...Object.fromEntries(
      Object.entries(props)
        .filter(([k]) => k !== titleKey && k !== '__id' && k !== '__created_time')
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
  return rows.map((r) => normalize({ __id: r.id, __created_time: r.created_time, ...r.properties }, titleKey));
}

export async function getRow(name, id, titleKey) {
  const res = await api('GET', `https://api.notion.com/v1/pages/${id}`);
  return normalize({ __id: res.id, __created_time: res.created_time, ...res.properties }, titleKey);
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

// ---------------------------------------------------------------------------
// Client Feedback
//
// The "Client Feedback" database is filled by a native Notion form, so its
// property names are the form's question wording and are NOT tidy — several have
// trailing spaces and question marks. They are mapped here, once, so nothing
// downstream has to know them. Verified against the live database schema.
//
// A native Notion form also cannot set a relation, so `Project` arrives empty on
// every submission. We therefore attribute a submission by matching the
// submitted `Business Name` against the Projects database (exact → normalized →
// containment), which is how a client's project is identified in practice.
// ---------------------------------------------------------------------------
export const FEEDBACK_PROPS = {
  title: 'Feedback ',
  FullName: 'Full Name',
  BusinessName: 'Business Name',
  Rating: 'What Rating (1-10) ',
  Submitted: 'Date Filed / Submitted',
  WentWell: 'What Went Well',
  CouldImprove: 'What Could We Have Done Better',
  Recommend: 'Would You Recommend LaunchOps ?',
  BiggestResult: 'Biggest Result So Far',
  Video: 'Record A 1-2min short video / Testimonial',
};

// Business names arrive typed by hand, so normalise hard before comparing:
// case, punctuation, "&"/"and", and legal suffixes ("Ltd", "LLC", "Group"…).
// \b anchors keep real words safe (e.g. "Co" never touches "Costco").
// Only TRUE legal-entity suffixes are stripped before an exact comparison.
// Brand words ("Group", "Holdings", "Services", "Solutions") are deliberately
// NOT stripped — they can distinguish two real clients (e.g. "London Solar
// Group" vs "London Solar"). They are merely ignored during token matching.
const LEGAL_SUFFIX = /\b(ltd|limited|llc|l\.l\.c|inc|incorporated|corp|corporation|co|company|gmbh|plc|pvt|private|sa|srl|bv|ag|oy|pte)\b/g;
const STOP_TOKEN = new Set(['the', 'and', 'ltd', 'limited', 'llc', 'inc', 'co', 'company', 'corp', 'corporation', 'gmbh', 'plc', 'pvt', 'private', 'group', 'holdings', 'enterprises', 'trading', 'services', 'solutions']);

const norm = (s) =>
  String(s ?? '')
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

const nameKey = (s) => norm(s).replace(LEGAL_SUFFIX, '').replace(/[^a-z0-9]/g, '');

const normTokens = (s) => norm(s).split(' ').filter((t) => t.length >= 3 && !STOP_TOKEN.has(t));

// Match a submitted `Business Name` to a project (whose `Client` title IS the
// business name).
//
// Rule: an exact hit wins outright. Otherwise the submitted name must point at
// exactly ONE project across every fuzzy test — if two projects are plausible
// (e.g. "Solar London" and "London Solar Group" both fit "London Solar Ltd"),
// we return null rather than attribute one client's feedback to another.
// Guessing wrong is worse than showing "—".
export function matchProjectId(businessName, projects = []) {
  const raw = String(businessName ?? '').trim();
  const key = nameKey(raw);
  if (!raw || key.length < 3) return null;

  // 1. Identical after normalising (case, punctuation, legal suffixes).
  const exact = projects.filter((p) => nameKey(p.title) === key);
  if (exact.length === 1) return exact[0].id;
  if (exact.length > 1) return null; // duplicate titles — ambiguous

  // 2. Fuzzy: one name contained in the other, or every token of the shorter
  //    name present in the longer ("Tripix" ↔ "Tripix.store").
  const bt = normTokens(raw);
  const loose = projects.filter((p) => {
    const pk = nameKey(p.title);
    if (pk.length >= 4 && (key.includes(pk) || pk.includes(key))) return true;
    const pt = normTokens(p.title);
    if (!bt.length || !pt.length) return false;
    const [shorter, longer] = bt.length <= pt.length ? [bt, pt] : [pt, bt];
    return shorter.every((t) => longer.includes(t));
  });

  return loose.length === 1 ? loose[0].id : null;
}

// Canonicalize one Client Feedback row: keep the raw properties, surface stable
// field names for the UI, and resolve the project (relation first, else by
// business name). `Submitted` falls back to the row's real created_time so a
// submission is never dateless.
export function canonicalFeedback(row, projects = []) {
  const relId = row.Project?.[0] || null;
  const projectId = relId || matchProjectId(row[FEEDBACK_PROPS.BusinessName], projects);
  const project = projectId ? projects.find((p) => p.id === projectId) || null : null;

  return {
    ...row,
    title: String(row.title || '').trim() || 'Untitled feedback',
    Rating: row[FEEDBACK_PROPS.Rating] ?? null,
    Submitted: row[FEEDBACK_PROPS.Submitted] || row.createdTime || null,
    'What Went Well': row[FEEDBACK_PROPS.WentWell] ?? null,
    'What Could Improve': row[FEEDBACK_PROPS.CouldImprove] ?? null,
    'Would Recommend': Boolean(row[FEEDBACK_PROPS.Recommend]),
    FullName: row[FEEDBACK_PROPS.FullName] ?? null,
    BusinessName: row[FEEDBACK_PROPS.BusinessName] ?? null,
    'Biggest Result So Far': row[FEEDBACK_PROPS.BiggestResult] ?? null,
    Video: (row[FEEDBACK_PROPS.Video] || [])[0] || null,
    projectId,
    projectName: project ? project.title : relId ? relId : null,
  };
}

// Every feedback row, canonicalized and newest-first, optionally scoped to a
// project (matched on the resolved project id so form submissions still count).
export async function listFeedback({ projectId } = {}) {
  const [projects, rows] = await Promise.all([
    listRows('Projects', 'Client'),
    listRows('Client Feedback', FEEDBACK_PROPS.title),
  ]);
  return rows
    .map((r) => canonicalFeedback(r, projects))
    .filter((f) => !projectId || f.projectId === projectId)
    .sort((a, b) => String(b.Submitted ?? '').localeCompare(String(a.Submitted ?? '')));
}