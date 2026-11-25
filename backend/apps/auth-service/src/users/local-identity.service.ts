import { Inject, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { AuthServiceConfig, LocalAuthUser } from '../config/auth.config';
import { SessionStoreService } from '../session/session-store.service';

@Injectable()
export class LocalIdentityService {
  private readonly usersByKey: Map<string, LocalAuthUser>;

  constructor(@Inject(ConfigService) config: ConfigService) {
    const cfg = config.getOrThrow<AuthServiceConfig>('auth');
    this.usersByKey = new Map();
    for (const u of cfg.users) {
      this.usersByKey.set(u.username.toLowerCase(), u);
      this.usersByKey.set(u.email.toLowerCase(), u);
    }
  }

  authenticate(username: string, password: string): LocalAuthUser {
    if (this.usersByKey.size === 0) {
      throw new UnauthorizedException('Local identity store is not configured');
    }
    const user = this.usersByKey.get(username.trim().toLowerCase());
    if (!user || !SessionStoreService.passwordsMatch(password, user.password)) {
      throw new UnauthorizedException('Invalid username or password');
    }
    return user;
  }

  /** Unique users (map holds each user under username and email). */
  listUsers(): LocalAuthUser[] {
    return [...new Set(this.usersByKey.values())];
  }

  findByUsername(userId: string): LocalAuthUser | undefined {
    return this.usersByKey.get(userId.toLowerCase());
  }
}