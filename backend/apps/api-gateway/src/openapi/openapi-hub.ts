import type { Logger } from '@nestjs/common';
import type { GatewayConfig } from '../config/gateway.config';
import * as swaggerUi from 'swagger-ui-express';

type OpenApiSource = { key: string; label: string; baseUrl: string };

function sources(config: GatewayConfig): OpenApiSource[] {
  return [
    { key: 'leads', label: 'Lead Service', baseUrl: config.services.leads },
    { key: 'opportunities', label: 'Opportunity Service', baseUrl: config.services.opportunities },
    { key: 'rfps', label: 'RFP Service', baseUrl: config.services.rfps },
    { key: 'documents', label: 'Document Service', baseUrl: config.services.documents },
    { key: 'approvals', label: 'Approval Service', baseUrl: config.services.approvals },
    { key: 'assignments', label: 'Assignment Service', baseUrl: config.services.assignments },
    { key: 'compliance', label: 'Compliance Service', baseUrl: config.services.compliance },
  ];
}

function gatewayPublicUrl(): string {
  const port = process.env.PORT || '3010';
  const host = process.env.GATEWAY_PUBLIC_HOST || 'localhost';
  return `http://${host}:${port}`;
}

/** Patches OpenAPI so Try-it-out targets the API Gateway /api/v1 prefix. */
function patchDocument(doc: Record<string, unknown>, source: OpenApiSource): Record<string, unknown> {
  const out = { ...doc };
  out.servers = [{ url: `${gatewayPublicUrl()}/api/v1`, description: 'DealPulse API Gateway' }];
  if (!out.info || typeof out.info !== 'object') {
    out.info = { title: source.label, version: '1.0' };
  } else {
    out.info = {
      ...(out.info as object),
      title: `${source.label} (via Gateway)`,
    };
  }
  if (out.tags && Array.isArray(out.tags)) {
    out.tags = (out.tags as { name: string }[]).map((t) => ({
      ...t,
      name: `${source.key} · ${t.name}`,
    }));
  }
  return out;
}

export function attachOpenApiHub(
  server: import('express').Application,
  config: GatewayConfig,
  logger: Logger,
): void {
  const list = sources(config);

  server.get('/api/openapi/:service.json', async (req, res) => {
    const src = list.find((s) => s.key === req.params.service);
    if (!src) {
      res.status(404).json({ message: 'Unknown service key' });
      return;
    }
    const url = `${src.baseUrl.replace(/\/$/, '')}/api/docs-json`;
    try {
      const r = await fetch(url, { signal: AbortSignal.timeout(config.proxyTimeoutMs) });
      if (!r.ok) {
        res.status(502).json({ message: `Upstream OpenAPI ${r.status} from ${url}` });
        return;
      }
      const doc = (await r.json()) as Record<string, unknown>;
      res.json(patchDocument(doc, src));
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'fetch failed';
      logger.warn(`OpenAPI hub: ${src.key} — ${msg}`);
      res.status(502).json({ message: msg, upstream: url });
    }
  });

  const swaggerUrls = list.map((s) => ({
    url: `/api/openapi/${s.key}.json`,
    name: s.label,
  }));

  server.use(
    '/api/docs',
    swaggerUi.serve,
    swaggerUi.setup(null, {
      swaggerOptions: {
        urls: swaggerUrls,
        persistAuthorization: true,
        docExpansion: 'list',
      },
      customSiteTitle: 'DealPulse API — Gateway Hub',
      customCss: '.swagger-ui .topbar { display: none }',
    }),
  );

  logger.log(
    `OpenAPI hub: ${gatewayPublicUrl()}/api/docs (${list.length} services; per-service /api/docs on each port)`,
  );
}