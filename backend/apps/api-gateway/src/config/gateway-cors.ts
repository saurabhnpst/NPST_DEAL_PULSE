import type { CorsOptions } from '@nestjs/common/interfaces/external/cors-options.interface';
import type { RequestHandler } from 'express';
import type { GatewayConfig } from './gateway.config';

// cors ships with @nestjs/platform-express; types live in @types/cors (not in repo).
// eslint-disable-next-line @typescript-eslint/no-require-imports
const cors = require('cors') as (options: CorsOptions) => RequestHandler;

const GATEWAY_ALLOWED_HEADERS = [
  'Content-Type',
  'Authorization',
  'X-CSRF-Token',
  'X-Requested-With',
  'X-Mock-Token',
  'X-Correlation-Id',
  'X-Changed-By',
  'X-Compliance-Actor-Id',
] as const;

export function gatewayCorsOptions(config: GatewayConfig): CorsOptions {
  return {
    origin: config.corsOrigins,
    credentials: config.corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [...GATEWAY_ALLOWED_HEADERS],
  };
}

export function gatewayCorsMiddleware(config: GatewayConfig): RequestHandler {
  return cors(gatewayCorsOptions(config));
}