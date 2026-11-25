import { clearCsrfToken, setCsrfToken, getCsrfToken } from '../api/apiClient.js';

const AUTH_BASE = import.meta.env.VITE_AUTH_BASE_URL ?? '';
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:3010/api/v1';

function authOrigin() {
  if (AUTH_BASE) return AUTH_BASE.replace(/\/$/, '');
  return API_BASE.replace(/\/api\/v1\/?$/, '');
}

export async function login(username, password, returnUrl) {
  const body = { username, password };
  if (returnUrl) body.returnUrl = returnUrl;
  const res = await fetch(`${authOrigin()}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    if (res.status === 401) throw new Error('Invalid username or password');
    throw new Error(`Sign-in failed (${res.status})`);
  }
  const data = await res.json();
  if (data?.csrfToken) setCsrfToken(data.csrfToken);
  return data;
}

export async function logout() {
  const csrf = getCsrfToken();
  const headers = csrf ? { 'X-CSRF-Token': csrf } : {};
  await fetch(`${authOrigin()}/api/auth/logout`, {
    method: 'POST',
    credentials: 'include',
    headers,
  }).catch(() => undefined);
  clearCsrfToken();
}

export async function fetchCurrentUser() {
  const res = await fetch(`${authOrigin()}/api/me`, { credentials: 'include' });
  if (res.status === 401) return null;
  if (!res.ok) throw new Error(`Profile fetch failed (${res.status})`);
  return res.json();
}