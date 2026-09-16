// src/lib/api.ts — fetch wrapper with timeout and loud error parsing.
// Never swallows failures: non-2xx responses throw ApiError carrying the
// server's { error } message verbatim so the UI can show it (BUILD_SPEC §6.3).

export class ApiError extends Error {
  status: number;
  fields?: Record<string, string>;

  constructor(message: string, status: number, fields?: Record<string, string>) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.fields = fields;
  }
}

const TIMEOUT_MS = 10_000;

export async function apiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let res: Response;
  try {
    res = await fetch(path, {
      ...options,
      signal: controller.signal,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers ?? {}),
      },
    });
  } catch (e) {
    clearTimeout(timer);
    if (e instanceof DOMException && e.name === 'AbortError') {
      throw new ApiError('The request timed out. Please try again.', 0);
    }
    throw new ApiError('Network error — could not reach the server. Please try again.', 0);
  }
  clearTimeout(timer);

  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = null;
  }

  if (!res.ok) {
    const message =
      body && typeof body === 'object' && 'error' in body && typeof (body as { error: unknown }).error === 'string'
        ? (body as { error: string }).error
        : `Request failed (${res.status}).`;
    const fields =
      body && typeof body === 'object' && 'fields' in body ? (body as { fields?: Record<string, string> }).fields : undefined;
    throw new ApiError(message, res.status, fields);
  }

  return body as T;
}