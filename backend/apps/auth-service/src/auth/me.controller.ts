import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { AuthServiceConfig } from '../config/auth.config';
import { LocalIdentityService } from '../users/local-identity.service';
import { SessionStoreService } from '../session/session-store.service';

type AuthedRequest = Request & { cookies?: Record<string, string> };

export interface MeResponse {
  userId: string;
  email: string;
  name: string;
  roles: string[];
  permissions: string[];
  tenantId: string;
  /** Numeric business user id (sent as x-user-id). */
  id: string;
  approvalActorId: string | null;
}

@Controller('api/me')
export class MeController {
  private readonly cookieName: string;

  constructor(
    config: ConfigService,
    private readonly identity: LocalIdentityService,
    private readonly sessions: SessionStoreService,
  ) {
    this.cookieName = config.getOrThrow<AuthServiceConfig>('auth').sessionCookieName;
  }

  @Get()
  async me(@Req() req: AuthedRequest): Promise<MeResponse> {
    const sessionId = req.cookies?.[this.cookieName];
    const record = await this.sessions.readSession(sessionId);
    if (!record) {
      throw new UnauthorizedException();
    }
    const profile = this.identity.findByUsername(record.userId);
    if (sessionId) {
      await this.sessions.touchSession(sessionId, record);
    }
    return {
      userId: record.userId,
      tenantId: record.tenantId,
      email: profile?.email ?? `${record.userId}@local.invalid`,
      name: profile?.name ?? record.userId,
      roles: profile?.roles ?? [],
      permissions: record.permissions,
      id: profile?.userId ?? record.userId,
      approvalActorId: profile?.approvalActorId ?? null,
    };
  }
}