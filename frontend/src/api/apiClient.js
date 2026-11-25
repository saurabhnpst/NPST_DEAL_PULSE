const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3000/api/v1';
const AUTH_BASE = import.meta.env.VITE_AUTH_BASE_URL ?? '';
const CSRF_STORAGE_KEY = 'dealplus.csrfToken';
const UNSAFE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

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
  constructor(status, message) {
    super(message ?? `HTTP ${status}`);
    this.status = status;
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
  const res = await fetch(url, { ...init, headers, credentials: 'include' });
  if (res.status === 401 || res.status === 403) {
    clearCsrfToken();
  }
  if (!res.ok) {
    throw new HttpError(res.status);
  }
  if (res.status === 204) return undefined;
  const text = await res.text();
  return text ? JSON.parse(text) : undefined;
}