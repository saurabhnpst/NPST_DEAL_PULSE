import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import type { GatewayConfig } from '../config/gateway.config';

type RouteRule = {
  path: string;
  target: string;
  pathRewrite?: Record<string, string>;
};

function proxyOptions(target: string) {
  return {
    target,
    changeOrigin: true,
    cookieDomainRewrite: '',
    on: {
      proxyReq: fixRequestBody,
      error: (err: Error, _req: unknown, res: { writeHead?: Function; end?: Function }) => {
        const logger = new Logger('GatewayProxy');
        logger.error(`Proxy error → ${target}: ${err.message}`);
        if (res && typeof res.writeHead === 'function') {
          res.writeHead(502, { 'Content-Type': 'application/json' });
          res.end?.(
            JSON.stringify({
              statusCode: 502,
              message: 'Upstream service unavailable',
            }),
          );
        }
      },
    },
  };
}

export function setupGatewayProxy(app: INestApplication): void {
  const config = app.get(ConfigService).getOrThrow<GatewayConfig>('gateway');
  const expressApp = app.getHttpAdapter().getInstance();

  const iamRoutes: RouteRule[] = [
    { path: '/api/auth', target: config.iamApiUrl },
    { path: '/api/me', target: config.iamApiUrl },
    { path: '/api/public', target: config.iamApiUrl },
  ];

  for (const route of iamRoutes) {
    expressApp.use(route.path, createProxyMiddleware(proxyOptions(route.target)));
  }

  const serviceRoutes: RouteRule[] = [
    { path: '/api/v1/leads', target: config.services.leads },
    { path: '/api/v1/documents', target: config.services.documents },
    { path: '/api/v1/uploads', target: config.services.documents },
    { path: '/api/v1/entity-documents', target: config.services.documents },
    { path: '/api/v1/rfps', target: config.services.rfps },
    { path: '/api/v1/opportunities', target: config.services.opportunities },
    { path: '/api/v1/approvals', target: config.services.approvals },
    { path: '/api/v1/decisions', target: config.services.approvals },
    { path: '/api/v1/assignments', target: config.services.assignments },
    { path: '/api/v1/compliance', target: config.services.compliance },
  ];

  for (const route of serviceRoutes) {
    expressApp.use(route.path, createProxyMiddleware(proxyOptions(route.target)));
  }
}