import { Controller, Get } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Public } from '../../../libs/command-module-auth/src';
import type { GatewayConfig } from './config/gateway.config';
import { gatewayServiceRoutes } from './proxy/gateway-proxy';

type Probe = {
  name: string;
  url: string;
  ok: boolean;
  status?: number;
  error?: string;
};

async function probeHealth(name: string, baseUrl: string, timeoutMs = 5_000): Promise<Probe> {
  const url = `${baseUrl.replace(/\/$/, '')}/api/v1/health`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { signal: controller.signal });
    return { name, url: baseUrl, ok: res.ok, status: res.status };
  } catch (err) {
    const message = err instanceof Error ? err.message : 'probe failed';
    return { name, url: baseUrl, ok: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

@Controller('health')
export class HealthController {
  constructor(private readonly config: ConfigService) {}

  @Public()
  @Get()
  liveness() {
    return {
      service: 'api-gateway',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  async readiness() {
    const gw = this.config.getOrThrow<GatewayConfig>('gateway');
    const routes = gatewayServiceRoutes(gw);
    const seen = new Set<string>();
    const targets: { name: string; url: string }[] = [];
    for (const r of routes) {
      if (seen.has(r.target)) continue;
      seen.add(r.target);
      targets.push({ name: r.path.replace('/api/v1/', ''), url: r.target });
    }
    const probes = await Promise.all(
      targets.map((t) => probeHealth(t.name, t.url)),
    );
    const allOk = probes.every((p) => p.ok);
    return {
      service: 'api-gateway',
      status: allOk ? 'ok' : 'degraded',
      timestamp: new Date().toISOString(),
      upstreams: probes,
    };
  }
}