import { registerAs } from '@nestjs/config';

export interface CommandModuleEnvConfig {
  enabled: boolean;
  redisUrl: string;
  sessionCookieName: string;
}

export default registerAs('commandModule', (): CommandModuleEnvConfig => {
  const redisUrl = process.env.REDIS_SERVICE_URL?.trim() ?? '';
  return {
    enabled: Boolean(redisUrl),
    redisUrl,
    sessionCookieName: process.env.SESSION_COOKIE_NAME?.trim() || 'session_id',
  };
});