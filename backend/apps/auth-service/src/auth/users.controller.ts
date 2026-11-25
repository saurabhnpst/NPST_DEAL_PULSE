import { Controller, Get, Req, UnauthorizedException } from '@nestjs/common';
import type { Request } from 'express';
import { ConfigService } from '@nestjs/config';
import type { AuthServiceConfig } from '../config/auth.config';
import { LocalIdentityService } from '../users/local-identity.service';
import { SessionStoreService } from '../session/session-store.service';

type AuthedRequest = Request & { cookies?: Record<string, string> };

export interface UserSummary {
  id: string;
  name: string;
  email: string;
  roles: string[];
  approvalActorId: string | null;
}

/** User directory for owner pickers and showing names for user ids (signed-in users only). */
@Controller('api/users')
export class UsersController {
  private readonly cookieName: string;

  constructor(
    config: ConfigService,
    private readonly identity: LocalIdentityService,
    private readonly sessions: SessionStoreService,
  ) {
    this.cookieName = config.getOrThrow<AuthServiceConfig>('auth').sessionCookieName;
  }

  @Get()
  async list(@Req() req: AuthedRequest): Promise<UserSummary[]> {
    const record = await this.sessions.readSession(req.cookies?.[this.cookieName]);
    if (!record) {
      throw new UnauthorizedException();
    }
    return this.identity.listUsers().map((u) => ({
      id: u.userId,
      name: u.name,
      email: u.email,
      roles: u.roles,
      approvalActorId: u.approvalActorId ?? null,
    }));
  }
}
