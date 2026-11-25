import { registerAs } from '@nestjs/config';

export interface LocalAuthUser {
  readonly username: string;
  readonly password: string;
  readonly email: string;
  readonly name: string;
  readonly roles: string[];
  readonly permissions: string[];
  readonly tenantId?: string;
}

export interface AuthServiceConfig {
  readonly redisUrl: string;
  readonly sessionCookieName: string;
  readonly sessionIdleMs: number;
  readonly sessionAbsoluteMs: number;
  readonly corsOrigins: string[];
  readonly users: LocalAuthUser[];
}

function parseUsers(raw: string | undefined): LocalAuthUser[] {
  if (!raw?.trim()) {
    return [];
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('AUTH_LOCAL_USERS must be a JSON array');
    }
    return parsed.map((row) => {
      const u = row as Record<string, unknown>;
      const username = String(u.username ?? '').trim();
      const password = String(u.password ?? '');
      if (!username || !password) {
        throw new Error('Each user needs username and password');
      }
      return {
        username,
        password,
        email: String(u.email ?? `${username}@local.invalid`),
        name: String(u.name ?? username),
        roles: Array.isArray(u.roles) ? u.roles.map(String) : ['employee'],
        permissions: Array.isArray(u.permissions) ? u.permissions.map(String) : [],
        tenantId: u.tenantId ? String(u.tenantId) : 'local',
      };
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'invalid JSON';
    throw new Error(`AUTH_LOCAL_USERS: ${message}`);
  }
}

const DEFAULT_CORS = 'http://localhost:5173,http://127.0.0.1:5173';

export default registerAs('auth', (): AuthServiceConfig => {
  const redisUrl =
    process.env.AUTH_REDIS_URL?.trim() ||
    process.env.REDIS_SERVICE_URL?.trim() ||
  'redis://127.0.0.1:6379';
  const idle = Number(process.env.AUTH_SESSION_IDLE_MS ?? 1_800_000);
  const absolute = Number(process.env.AUTH_SESSION_ABSOLUTE_MS ?? 28_800_000);
  return {
    redisUrl,
    sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || 'session_id',
    sessionIdleMs: Number.isFinite(idle) && idle > 0 ? idle : 1_800_000,
    sessionAbsoluteMs: Number.isFinite(absolute) && absolute > 0 ? absolute : 28_800_000,
    corsOrigins: (process.env.CORS_ORIGINS ?? DEFAULT_CORS)
      .split(',')
      .map((s) => s.trim().replace(/\/$/, ''))
      .filter(Boolean),
    users: parseUsers(process.env.AUTH_LOCAL_USERS),
  };
});