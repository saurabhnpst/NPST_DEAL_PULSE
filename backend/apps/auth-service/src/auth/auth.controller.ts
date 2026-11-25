import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import type { Response, Request } from 'express';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../../libs/command-module-auth/src';
import type { AuthServiceConfig } from '../config/auth.config';
import { LoginDto } from '../dto/login.dto';
import { LocalIdentityService } from '../users/local-identity.service';
import { SessionStoreService } from '../session/session-store.service';

type AuthedRequest = Request & { cookies?: Record<string, string> };

@Controller('api/auth')
export class AuthController {
  private readonly cfg: AuthServiceConfig;

  constructor(
    config: ConfigService,
    private readonly identity: LocalIdentityService,
    private readonly sessions: SessionStoreService,
  ) {
    this.cfg = config.getOrThrow<AuthServiceConfig>('auth');
  }

  private cookieOptions() {
    return {
      httpOnly: true,
      sameSite: 'lax' as const,
      secure: process.env.NODE_ENV === 'production',
      path: '/',
    };
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ csrfToken: string }> {
    const user = this.identity.authenticate(dto.username, dto.password);
    const { sessionId, csrfToken } = await this.sessions.createSession(user);
    res.cookie(this.cfg.sessionCookieName, sessionId, this.cookieOptions());
    return { csrfToken };
  }

  @Get('csrf')
  @HttpCode(200)
  async csrf(@Req() req: AuthedRequest): Promise<{ csrfToken: string }> {
    const sessionId = req.cookies?.[this.cfg.sessionCookieName];
    const record = await this.sessions.readSession(sessionId);
    if (!record) {
      throw new UnauthorizedException();
    }
    if (sessionId) {
      await this.sessions.touchSession(sessionId, record);
    }
    return { csrfToken: record.csrfToken };
  }

  @Post('logout')
  @HttpCode(204)
  async logout(@Req() req: AuthedRequest, @Res({ passthrough: true }) res: Response): Promise<void> {
    const sessionId = req.cookies?.[this.cfg.sessionCookieName];
    await this.sessions.destroySession(sessionId);
    res.clearCookie(this.cfg.sessionCookieName, this.cookieOptions());
  }
}