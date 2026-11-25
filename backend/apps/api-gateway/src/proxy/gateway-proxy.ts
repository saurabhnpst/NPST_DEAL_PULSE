import type { Server } from 'http';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import type { GatewayConfig } from '../config/gateway.config';

type RouteRule = { path: string; target: string };

function proxyOptions(target: string, timeoutMs: number) {
  return {
    target,
    changeOrigin: true,
    timeout: timeoutMs,
    proxyTimeout: timeoutMs,
    cookieDomainRewrite: '',
    on: {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      proxyReq: (proxyReq: any, req: any) => {
        fixRequestBody(proxyReq, req);
        const correlation =
          (typeof req.headers['x-correlation-id'] === 'string' && req.headers['x-correlation-id']) ||
          (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id']);
        if (correlation) {
          proxyReq.setHeader('x-correlation-id', correlation);
        }
      },
      error: (err: Error, _req: unknown, res: { writeHead?: Function; end?: Function }) => {
        const logger = new Logger('GatewayProxy');
        logger.error(`Proxy error → ${target}: ${err.message}`);
        if (res && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end?.(
            JSON.stringify({
              statusCode: 502,
              message: 'Upstream service unavailable',
              error: 'Bad Gateway',
            }),
          );
        }
      },
    },
  };
}

/** Upstream service routes (longest prefix wins in router). */
export function gatewayServiceRoutes(config: GatewayConfig): RouteRule[] {
  return [
    { path: '/api/v1/leads', target: config.services.leads },
    { path: '/api/v1/opportunities', target: config.services.opportunities },
    { path: '/api/v1/rfps', target: config.services.rfps },
    { path: '/api/v1/documents', target: config.services.documents },
    { path: '/api/v1/uploads', target: config.services.documents },
    { path: '/api/v1/entity-documents', target: config.services.documents },
    { path: '/api/v1/approvals', target: config.services.approvals },
    { path: '/api/v1/decisions', target: config.services.approvals },
    { path: '/api/v1/assignments', target: config.services.assignments },
    { path: '/api/v1/handoffs', target: config.services.assignments },
    { path: '/api/v1/requirements', target: config.services.assignments },
    { path: '/api/v1/product-verticals', target: config.services.assignments },
    { path: '/api/v1/compliance', target: config.services.compliance },
    { path: '/api/v1/frameworks', target: config.services.compliance },
    { path: '/api/v1/assessments', target: config.services.compliance },
    { path: '/api/v1/configurations', target: config.services.compliance },
  ];
}

function requestPathname(reqUrl: string): string {
  const raw = reqUrl.split('?')[0] ?? '';
  if (raw.startsWith('http://') || raw.startsWith('https://')) {
    try {
      return new URL(raw).pathname;
    } catch {
      return raw;
    }
  }
  return raw.startsWith('/') ? raw : `/${raw}`;
}

function pickTarget(pathname: string, routes: RouteRule[]): string | undefined {
  const match = routes
    .filter((r) => pathname === r.path || pathname.startsWith(`${r.path}/`))
    .sort((a, b) => b.path.length - a.path.length)[0];
  return match?.target;
}

/** Attach HTTP proxy to an Express server **before** Nest mounts controllers. */
export function attachGatewayProxy(
  server: { use: (handler: unknown) => void },
  config: GatewayConfig,
  logger: Logger,
): void {
  const routes = gatewayServiceRoutes(config);

  for (const route of routes) {
    logger.log(`Service proxy ${route.path} → ${route.target}`);
  }

  const iamTarget = config.iamApiUrl || 'http://127.0.0.1:9';

  const businessProxy = createProxyMiddleware({
    changeOrigin: true,
    timeout: config.proxyTimeoutMs,
    proxyTimeout: config.proxyTimeoutMs,
    router: (req) => {
      const pathname = requestPathname(req.url ?? '');
      const target = pickTarget(pathname, routes);
      if (!target) {
        throw new Error(`No upstream for ${pathname}`);
      }
      return target;
    },
    pathFilter: (pathname) => {
      const p = requestPathname(pathname);
      if (!p.startsWith('/api/v1/')) return false;
      return Boolean(pickTarget(p, routes));
    },
    on: proxyOptions(config.services.leads, config.proxyTimeoutMs).on,
  });

  if (config.iamApiUrl) {
    const iamRouteProxy = createProxyMiddleware({
      ...proxyOptions(iamTarget, config.proxyTimeoutMs),
      pathFilter: (pathname) => {
        const p = requestPathname(pathname);
        return (
          p.startsWith('/api/auth') ||
          p === '/api/me' ||
          p.startsWith('/api/me/') ||
          p.startsWith('/api/public')
        );
      },
    });
    server.use(iamRouteProxy);
    logger.log(`IAM proxy /api/auth, /api/me → ${config.iamApiUrl}`);
  }

  server.use(businessProxy);
}

export function setupGatewayProxy(app: INestApplication): void {
  const config = app.get(ConfigService).getOrThrow<GatewayConfig>('gateway');
  const server = app.getHttpServer() as Server;
  const logger = new Logger('GatewayProxy');
  attachGatewayProxy(server as unknown as { use: (handler: unknown) => void }, config, logger);
}