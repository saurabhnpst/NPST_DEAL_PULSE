"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('commandModule', () => {
    const redisUrl = process.env.REDIS_SERVICE_URL?.trim() ?? '';
    return {
        enabled: Boolean(redisUrl),
        redisUrl,
        sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || 'session_id',
    };
});
//# sourceMappingURL=command-module.config.js.map