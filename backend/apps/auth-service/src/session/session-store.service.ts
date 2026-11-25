import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'crypto';
import type { AuthServiceConfig, LocalAuthUser } from '../config/auth.config';
import type { SessionRecord } from '../../../../libs/command-module-auth/src';

/**
 * Local development session store (in memory, no Redis).
 * Sessions are lost when auth-service restarts — users simply sign in again.
 */
@Injectable()
export class SessionStoreService {
  private readonly sessions = new Map<string, SessionRecord>();
  private readonly cfg: AuthServiceConfig;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.cfg = config.getOrThrow<AuthServiceConfig>('auth');
  }

  async createSession(user: LocalAuthUser): Promise<{ sessionId: string; csrfToken: string }> {
    const sessionId = randomBytes(24).toString('hex');
    const csrfToken = randomBytes(24).toString('hex');
    const now = Date.now();
    this.sessions.set(sessionId, {
      schemaVersion: 1,
      userId: user.username,
      tenantId: user.tenantId ?? 'local',
      permissions: user.permissions,
      permissionsVersion: 1,
      csrfToken,
      idleExpiresAt: new Date(now + this.cfg.sessionIdleMs).toISOString(),
      absoluteExpiresAt: new Date(now + this.cfg.sessionAbsoluteMs).toISOString(),
    });
    return { sessionId, csrfToken };
  }

  async readSession(sessionId: string | undefined): Promise<SessionRecord | null> {
    if (!sessionId) return null;
    const record = this.sessions.get(sessionId);
    if (!record) return null;
    const now = Date.now();
    if (
      now >= new Date(record.absoluteExpiresAt).getTime() ||
      now >= new Date(record.idleExpiresAt).getTime()
    ) {
      this.sessions.delete(sessionId);
      return null;
    }
    return record;
  }

  async touchSession(sessionId: string, record: SessionRecord): Promise<void> {
    this.sessions.set(sessionId, {
      ...record,
      idleExpiresAt: new Date(Date.now() + this.cfg.sessionIdleMs).toISOString(),
    });
  }

  async destroySession(sessionId: string | undefined): Promise<void> {
    if (sessionId) this.sessions.delete(sessionId);
  }

  static passwordsMatch(given: string, expected: string): boolean {
    const left = Buffer.from(given, 'utf8');
    const right = Buffer.from(expected, 'utf8');
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }
}
