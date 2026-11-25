import { registerAs } from '@nestjs/config';

export interface GatewayConfig {
  corsOrigins: string[];
  corsCredentials: boolean;
  iamApiUrl: string;
  proxyTimeoutMs: number;
  services: {
    leads: string;
    opportunities: string;
    approvals: string;
    assignments: string;
    compliance: string;
    documents: string;
    rfps: string;
  };
}

const DEFAULT_CORS_ORIGINS =
  'http://localhost:5173,http://127.0.0.1:5173';

function parseCorsOrigins(raw: string | undefined): string[] {
  return (raw ?? DEFAULT_CORS_ORIGINS)
    .split(',')
    .map((s) => s.trim().replace(/\/$/, ''))
    .filter(Boolean);
}

export default registerAs('gateway', (): GatewayConfig => {
  const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGINS);

  const timeoutRaw = Number(process.env.GATEWAY_PROXY_TIMEOUT_MS ?? 120_000);
  const proxyTimeoutMs =
    Number.isFinite(timeoutRaw) && timeoutRaw >= 1_000 ? timeoutRaw : 120_000;

  return {
    corsOrigins,
    corsCredentials: process.env.CORS_CREDENTIALS !== 'false',
    iamApiUrl: process.env.IAM_API_URL?.trim().replace(/\/$/, '') ?? '',
    proxyTimeoutMs,
    services: {
      leads: process.env.LEAD_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3002',
      opportunities:
        process.env.OPPORTUNITY_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3003',
      approvals:
        process.env.APPROVAL_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3006',
      assignments:
        process.env.ASSIGNMENT_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3007',
      compliance:
        process.env.COMPLIANCE_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3008',
      documents:
        process.env.DOCUMENT_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3005',
      rfps: process.env.RFP_SERVICE_URL?.replace(/\/$/, '') ?? 'http://localhost:3004',
    },
  };
});