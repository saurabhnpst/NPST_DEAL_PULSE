"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var CommandModuleAuthModule_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommandModuleAuthModule = exports.SessionAuthGuard = exports.SessionReader = exports.CurrentUser = exports.Public = exports.RequirePermission = exports.COMMAND_MODULE_AUTH_REDIS = exports.COMMAND_MODULE_AUTH_OPTIONS = exports.IS_PUBLIC_KEY = exports.REQUIRE_PERMISSION_KEY = void 0;
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const crypto_1 = require("crypto");
const ioredis_1 = require("ioredis");
exports.REQUIRE_PERMISSION_KEY = 'require_permission';
exports.IS_PUBLIC_KEY = 'command_module_public';
exports.COMMAND_MODULE_AUTH_OPTIONS = Symbol('COMMAND_MODULE_AUTH_OPTIONS');
exports.COMMAND_MODULE_AUTH_REDIS = Symbol('COMMAND_MODULE_AUTH_REDIS');
const RequirePermission = (permission) => (0, common_1.SetMetadata)(exports.REQUIRE_PERMISSION_KEY, permission);
exports.RequirePermission = RequirePermission;
const Public = () => (0, common_1.SetMetadata)(exports.IS_PUBLIC_KEY, true);
exports.Public = Public;
exports.CurrentUser = (0, common_1.createParamDecorator)((_, ctx) => {
    const req = ctx.switchToHttp().getRequest();
    if (!req.user) {
        throw new common_1.UnauthorizedException();
    }
    return req.user;
});
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
function constantTimeEquals(a, b) {
    const left = Buffer.from(a, 'utf8');
    const right = Buffer.from(b, 'utf8');
    if (left.length !== right.length) {
        return false;
    }
    return (0, crypto_1.timingSafeEqual)(left, right);
}
let SessionReader = class SessionReader {
    constructor(options, redis) {
        this.options = options;
        this.ownsRedis = !redis;
        this.redis = redis ?? new ioredis_1.default(options.redisUrl, { maxRetriesPerRequest: 1 });
    }
    async onModuleDestroy() {
        if (this.ownsRedis) {
            try {
                await this.redis.quit();
            }
            catch {
                this.redis.disconnect();
            }
        }
    }
    async readSession(sessionId) {
        if (!sessionId) {
            return null;
        }
        let raw;
        try {
            raw = await this.redis.get(`sess:${sessionId}`);
        }
        catch {
            throw new common_1.ServiceUnavailableException('Session store unavailable');
        }
        if (!raw) {
            return null;
        }
        const record = JSON.parse(raw);
        const now = Date.now();
        if (now >= new Date(record.absoluteExpiresAt).getTime() ||
            now >= new Date(record.idleExpiresAt).getTime()) {
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
};
exports.SessionReader = SessionReader;
exports.SessionReader = SessionReader = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, common_1.Inject)(exports.COMMAND_MODULE_AUTH_OPTIONS)),
    __param(1, (0, common_1.Optional)()),
    __param(1, (0, common_1.Inject)(exports.COMMAND_MODULE_AUTH_REDIS)),
    __metadata("design:paramtypes", [Object, ioredis_1.default])
], SessionReader);
let SessionAuthGuard = class SessionAuthGuard {
    constructor(reflector, reader, options) {
        this.reflector = reflector;
        this.reader = reader;
        this.options = options;
    }
    async canActivate(context) {
        const isPublic = this.reflector.getAllAndOverride(exports.IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        if (isPublic) {
            return true;
        }
        const req = context.switchToHttp().getRequest();
        const sessionId = req.cookies?.[this.options.sessionCookieName];
        const user = await this.reader.readSession(sessionId);
        if (!user) {
            throw new common_1.UnauthorizedException();
        }
        req.user = user;
        if (UNSAFE_METHODS.has((req.method ?? 'GET').toUpperCase())) {
            const header = req.headers['x-csrf-token'];
            const token = typeof header === 'string' ? header : undefined;
            if (!token || !constantTimeEquals(token, user.csrfToken)) {
                throw new common_1.ForbiddenException('Invalid CSRF token');
            }
        }
        const permission = this.reflector.get(exports.REQUIRE_PERMISSION_KEY, context.getHandler());
        if (permission && !user.permissions.includes(permission)) {
            throw new common_1.ForbiddenException();
        }
        return true;
    }
};
exports.SessionAuthGuard = SessionAuthGuard;
exports.SessionAuthGuard = SessionAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __param(2, (0, common_1.Inject)(exports.COMMAND_MODULE_AUTH_OPTIONS)),
    __metadata("design:paramtypes", [core_1.Reflector,
        SessionReader, Object])
], SessionAuthGuard);
let CommandModuleAuthModule = CommandModuleAuthModule_1 = class CommandModuleAuthModule {
    static forRoot(options) {
        return this.build({ provide: exports.COMMAND_MODULE_AUTH_OPTIONS, useValue: options }, []);
    }
    static forRootAsync(options) {
        return this.build({
            provide: exports.COMMAND_MODULE_AUTH_OPTIONS,
            useFactory: options.useFactory,
            inject: (options.inject ?? []),
        }, (options.imports ?? []));
    }
    static build(optionsProvider, imports) {
        return {
            module: CommandModuleAuthModule_1,
            imports,
            providers: [
                optionsProvider,
                SessionReader,
                SessionAuthGuard,
            ],
            exports: [exports.COMMAND_MODULE_AUTH_OPTIONS, SessionReader, SessionAuthGuard],
        };
    }
};
exports.CommandModuleAuthModule = CommandModuleAuthModule;
exports.CommandModuleAuthModule = CommandModuleAuthModule = CommandModuleAuthModule_1 = __decorate([
    (0, common_1.Module)({})
], CommandModuleAuthModule);
//# sourceMappingURL=index.js.map