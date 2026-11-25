import { Inject, Injectable, OnModuleDestroy, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomBytes, timingSafeEqual } from 'crypto';
import Redis from 'ioredis';
import type { AuthServiceConfig, LocalAuthUser } from '../config/auth.config';
import type { SessionRecord } from '../../../../libs/command-module-auth/src';

@Injectable()
export class SessionStoreService implements OnModuleDestroy {
  private readonly redis: Redis;
  private readonly cfg: AuthServiceConfig;

  constructor(@Inject(ConfigService) config: ConfigService) {
    this.cfg = config.getOrThrow<AuthServiceConfig>('auth');
    this.redis = new Redis(this.cfg.redisUrl, { maxRetriesPerRequest: 1 });
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.redis.quit();
    } catch {
      this.redis.disconnect();
    }
  }

  private key(sessionId: string): string {
    return `sess:${sessionId}`;
  }

  async createSession(user: LocalAuthUser): Promise<{ sessionId: string; csrfToken: string }> {
    const sessionId = randomBytes(24).toString('hex');
    const csrfToken = randomBytes(24).toString('hex');
    const now = Date.now();
    const record: SessionRecord = {
      schemaVersion: 1,
      userId: user.username,
      tenantId: user.tenantId ?? 'local',
      permissions: user.permissions,
      permissionsVersion: 1,
      csrfToken,
      idleExpiresAt: new Date(now + this.cfg.sessionIdleMs).toISOString(),
      absoluteExpiresAt: new Date(now + this.cfg.sessionAbsoluteMs).toISOString(),
    };
    const ttlSec = Math.ceil(this.cfg.sessionAbsoluteMs / 1000);
    try {
      await this.redis.set(this.key(sessionId), JSON.stringify(record), 'EX', ttlSec);
    } catch {
      throw new ServiceUnavailableException('Session store unavailable');
    }
    return { sessionId, csrfToken };
  }

  async readSession(sessionId: string | undefined): Promise<SessionRecord | null> {
    if (!sessionId) return null;
    let raw: string | null;
    try {
      raw = await this.redis.get(this.key(sessionId));
    } catch {
      throw new ServiceUnavailableException('Session store unavailable');
    }
    if (!raw) return null;
    const record = JSON.parse(raw) as SessionRecord;
    const now = Date.now();
    if (
      now >= new Date(record.absoluteExpiresAt).getTime() ||
      now >= new Date(record.idleExpiresAt).getTime()
    ) {
      return null;
    }
    return record;
  }

  async touchSession(sessionId: string, record: SessionRecord): Promise<void> {
    const refreshed = {
      ...record,
      idleExpiresAt: new Date(Date.now() + this.cfg.sessionIdleMs).toISOString(),
    };
    const ttlSec = Math.max(
      1,
      Math.ceil((new Date(refreshed.absoluteExpiresAt).getTime() - Date.now()) / 1000),
    );
    await this.redis.set(this.key(sessionId), JSON.stringify(refreshed), 'EX', ttlSec);
  }

  async destroySession(sessionId: string | undefined): Promise<void> {
    if (!sessionId) return;
    try {
      await this.redis.del(this.key(sessionId));
    } catch {
      throw new ServiceUnavailableException('Session store unavailable');
    }
  }

  static passwordsMatch(given: string, expected: string): boolean {
    const left = Buffer.from(given, 'utf8');
    const right = Buffer.from(expected, 'utf8');
    if (left.length !== right.length) return false;
    return timingSafeEqual(left, right);
  }
}