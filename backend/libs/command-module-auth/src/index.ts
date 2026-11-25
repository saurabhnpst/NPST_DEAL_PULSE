/**
 * Session validation aligned with the external Command Module (auth_gateway).
 * Source reference: auth_gateway/platform-libs/packages/auth-shared
 * Sessions are stored in Redis under `sess:{sessionId}` by iam-api.
 */
import {
  CanActivate,
  DynamicModule,
  ExecutionContext,
  ForbiddenException,
  Inject,
  Injectable,
  Module,
  OnModuleDestroy,
  Optional,
  Provider,
  ServiceUnavailableException,
  SetMetadata,
  UnauthorizedException,
  createParamDecorator,
} from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { timingSafeEqual } from 'crypto';
import Redis from 'ioredis';

export const REQUIRE_PERMISSION_KEY = 'require_permission';
export const IS_PUBLIC_KEY = 'command_module_public';
export const COMMAND_MODULE_AUTH_OPTIONS = Symbol('COMMAND_MODULE_AUTH_OPTIONS');
export const COMMAND_MODULE_AUTH_REDIS = Symbol('COMMAND_MODULE_AUTH_REDIS');

export const RequirePermission = (permission: string) =>
  SetMetadata(REQUIRE_PERMISSION_KEY, permission);

export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

export interface SessionUser {
  userId: string;
  tenantId: string;
  permissions: string[];
  permissionsVersion: number;
  csrfToken: string;
}

export const CurrentUser = createParamDecorator(
  (_: unknown, ctx: ExecutionContext): SessionUser => {
    const req = ctx.switchToHttp().getRequest<{ user?: SessionUser }>();
    if (!req.user) {
      throw new UnauthorizedException();
    }
    return req.user;
  },
);

export interface SessionRecord {
  schemaVersion?: number;
  userId: string;
  tenantId: string;
  permissions: string[];
  permissionsVersion: number;
  csrfToken: string;
  idleExpiresAt: string;
  absoluteExpiresAt: string;
}

export interface CommandModuleAuthOptions {
  redisUrl: string;
  sessionCookieName: string;
}

export interface CommandModuleAuthAsyncOptions {
  imports?: unknown[];
  inject?: unknown[];
  useFactory: (
    ...args: never[]
  ) => CommandModuleAuthOptions | Promise<CommandModuleAuthOptions>;
}

const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

function constantTimeEquals(a: string, b: string): boolean {
  const left = Buffer.from(a, 'utf8');
  const right = Buffer.from(b, 'utf8');
  if (left.length !== right.length) {
    return false;
  }
  return timingSafeEqual(left, right);
}

@Injectable()
export class SessionReader implements OnModuleDestroy {
  private redis: Redis;
  private readonly ownsRedis: boolean;

  constructor(
    @Inject(COMMAND_MODULE_AUTH_OPTIONS)
    private readonly options: CommandModuleAuthOptions,
    @Optional() @Inject(COMMAND_MODULE_AUTH_REDIS) redis?: Redis,
  ) {
    this.ownsRedis = !redis;
    this.redis = redis ?? new Redis(options.redisUrl, { maxRetriesPerRequest: 1 });
  }

  async onModuleDestroy(): Promise<void> {
    if (this.ownsRedis) {
      try {
        await this.redis.quit();
      } catch {
        this.redis.disconnect();
      }
    }
  }

  async readSession(sessionId: string | undefined): Promise<SessionUser | null> {
    if (!sessionId) {
      return null;
    }
    let raw: string | null;
    try {
      raw = await this.redis.get(`sess:${sessionId}`);
    } catch {
      throw new ServiceUnavailableException('Session store unavailable');
    }
    if (!raw) {
      return null;
    }
    const record = JSON.parse(raw) as SessionRecord;
    const now = Date.now();
    if (
      now >= new Date(record.absoluteExpiresAt).getTime() ||
      now >= new Date(record.idleExpiresAt).getTime()
    ) {
      return null;
    }
    return {
      userId: record.userId,
      tenantId: record.tenantId,
      permissions: record.permissions,
      permissionsVersion: record.permissionsVersion,
      csrfToken: record.csrfToken,
    };
  }
}

@Injectable()
export class SessionAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly reader: SessionReader,
    @Inject(COMMAND_MODULE_AUTH_OPTIONS)
    private readonly options: CommandModuleAuthOptions,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const req = context.switchToHttp().getRequest<{
      method?: string;
      cookies?: Record<string, string>;
      headers: Record<string, string | string[] | undefined>;
      user?: SessionUser;
    }>();
    const sessionId = req.cookies?.[this.options.sessionCookieName];
    const user = await this.reader.readSession(sessionId);
    if (!user) {
      throw new UnauthorizedException();
    }
    req.user = user;

    if (UNSAFE_METHODS.has((req.method ?? 'GET').toUpperCase())) {
      const header = req.headers['x-csrf-token'];
      const token = typeof header === 'string' ? header : undefined;
      if (!token || !constantTimeEquals(token, user.csrfToken)) {
        throw new ForbiddenException('Invalid CSRF token');
      }
    }

    const permission = this.reflector.get<string | undefined>(
      REQUIRE_PERMISSION_KEY,
      context.getHandler(),
    );
    if (permission && !user.permissions.includes(permission)) {
      throw new ForbiddenException();
    }
    return true;
  }
}

@Module({})
export class CommandModuleAuthModule {
  static forRoot(options: CommandModuleAuthOptions): DynamicModule {
    return this.build({ provide: COMMAND_MODULE_AUTH_OPTIONS, useValue: options }, []);
  }

  static forRootAsync(options: CommandModuleAuthAsyncOptions): DynamicModule {
    return this.build(
      {
        provide: COMMAND_MODULE_AUTH_OPTIONS,
        useFactory: options.useFactory,
        inject: (options.inject ?? []) as never[],
      },
      (options.imports ?? []) as never[],
    );
  }

  private static build(optionsProvider: Provider, imports: never[]): DynamicModule {
    return {
      module: CommandModuleAuthModule,
      imports,
      providers: [
        optionsProvider,
        SessionReader,
        SessionAuthGuard,
      ],
      exports: [COMMAND_MODULE_AUTH_OPTIONS, SessionReader, SessionAuthGuard],
    };
  }
}