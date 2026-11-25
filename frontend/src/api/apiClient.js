const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010/api/v1';
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE_URL ?? '';
const CSRF_STORAGE_KEY = 'dealplus.csrfToken';
const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const DEFAULT_TIMEOUT_MS = Number(import.meta.env.VITE_API_TIMEOUT_MS || 120000);

// Signed-in user, sent to services as x-user-id / x-changed-by / x-actor-id (set by Auth.jsx).
let apiUser = null;
export function setApiUser(me) {
  apiUser = me || null;
}

function addUserHeaders(headers) {
  if (!apiUser) return;
  if (apiUser.id) {
    headers.set('x-user-id', String(apiUser.id));
    headers.set('x-changed-by', String(apiUser.id));
  }
  if (apiUser.approvalActorId) headers.set('x-actor-id', apiUser.approvalActorId);
}

export function getCsrfToken() {
  try {
    return sessionStorage.getItem(CSRF_STORAGE_KEY) ?? '';
  } catch {
    return '';
  }
}

export function setCsrfToken(token) {
  try {
    sessionStorage.setItem(CSRF_STORAGE_KEY, token);
  } catch {
    /* ignore */
  }
}

export function clearCsrfToken() {
  try {
    sessionStorage.removeItem(CSRF_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

async function loadCsrfToken() {
  const existing = getCsrfToken();
  if (existing) return existing;
  const base = AUTH_BASE || API_BASE.replace(/\/api\/v1\/?$/, '');
  const res = await fetch(`${base}/api/auth/csrf`, { credentials: 'include' });
  if (!res.ok) {
    clearCsrfToken();
    throw new Error(`CSRF fetch failed (${res.status})`);
  }
  const body = await res.json();
  if (!body?.csrfToken) throw new Error('CSRF token missing');
  setCsrfToken(body.csrfToken);
  return body.csrfToken;
}

export class HttpError extends Error {
  constructor(status, message, details) {
    super(message ?? `HTTP ${status}`);
    this.status = status;
    this.details = details;
  }
}

async function parseErrorBody(res) {
  const text = await res.text();
  try {
    const json = JSON.parse(text);
    const msg =
      json?.error?.message ||
      json?.message ||
      (Array.isArray(json?.message) ? json.message.join(', ') : null);
    return { message: msg || text.slice(0, 300) || `HTTP ${res.status}`, json };
  } catch {
    return { message: text.slice(0, 300) || `HTTP ${res.status}`, json: null };
  }
}

export async function apiFetch(path, init = {}) {
  const headers = new Headers(init.headers);
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }
  const method = (init.method ?? 'GET').toUpperCase();
  if (UNSAFE_METHODS.includes(method)) {
    headers.set('X-CSRF-Token', await loadCsrfToken());
  }
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  addUserHeaders(headers);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { ...init, headers, credentials: 'include', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (res.status === 401 || res.status === 403) {
    clearCsrfToken();
  }
  if (!res.ok) {
    const { message, json } = await parseErrorBody(res);
    throw new HttpError(res.status, message, json);
  }
  if (res.status === 204) return undefined;
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}

/** Multipart upload (e.g. document uploads) — do not set Content-Type manually. */
export async function apiUpload(path, formData, init = {}) {
  const headers = new Headers(init.headers);
  addUserHeaders(headers);
  const method = (init.method ?? 'POST').toUpperCase();
  if (UNSAFE_METHODS.includes(method)) {
    headers.set('X-CSRF-Token', await loadCsrfToken());
  }
  const url = path.startsWith('http') ? path : `${API_BASE}${path.startsWith('/') ? path : `/${path}`}`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), init.timeoutMs ?? DEFAULT_TIMEOUT_MS);
  let res;
  try {
    res = await fetch(url, { method, ...init, body: formData, headers, credentials: 'include', signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const { message, json } = await parseErrorBody(res);
    throw new HttpError(res.status, message, json);
  }
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}