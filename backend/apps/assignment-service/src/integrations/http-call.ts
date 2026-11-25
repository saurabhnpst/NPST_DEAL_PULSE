import { BadGatewayException, ServiceUnavailableException } from '@nestjs/common';

/** How long to wait for another service before giving up. */
const TIMEOUT_MS = Number(process.env.SERVICE_CALL_TIMEOUT_MS) || 5000;

type CallOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT';
  body?: unknown;
  /** Passed on as the x-user-id header so the other service records who did it. */
  actorUserId?: string | number | null;
};

/**
 * Calls another DealPlus service and returns its `data`.
 * - 404 → null (the record doesn't exist)
 * - other error status → 502 BAD_GATEWAY with the other service's message
 * - service down / timeout → 503 SERVICE_UNAVAILABLE
 * Works with the standard `{ success, data }` envelope and with plain JSON bodies.
 */
export async function callService<T>(
  serviceName: string,
  baseUrl: string,
  path: string,
  options: CallOptions = {},
): Promise<T | null> {
  const headers: Record<string, string> = { accept: 'application/json' };
  if (options.body !== undefined) headers['content-type'] = 'application/json';
  if (options.actorUserId != null) headers['x-user-id'] = String(options.actorUserId);

  let res: Response;
  try {
    res = await fetch(`${baseUrl.replace(/\/$/, '')}${path}`, {
      method: options.method ?? 'GET',
      headers,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (err) {
    const reason = err instanceof Error ? err.message : 'unreachable';
    throw new ServiceUnavailableException(`${serviceName} is unavailable (${reason})`);
  }

  if (res.status === 404) return null;

  const body = (await res.json().catch(() => null)) as
    | { success?: boolean; data?: T; error?: { message?: string } }
    | null;

  if (!res.ok || body?.success === false) {
    const message = body?.error?.message ?? `HTTP ${res.status}`;
    throw new BadGatewayException(`${serviceName}: ${message}`);
  }
  return (body && 'data' in body ? body.data : body) as T;
}
