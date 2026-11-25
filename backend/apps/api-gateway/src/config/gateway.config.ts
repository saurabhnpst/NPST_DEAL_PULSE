import { registerAs } from '@nestjs/config';

export interface GatewayConfig {
  corsOrigins: string[];
  corsCredentials: boolean;
  iamApiUrl: string;
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

export default registerAs('gateway', (): GatewayConfig => {
  const corsOrigins = (process.env.CORS_ORIGINS ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  return {
    corsOrigins,
    corsCredentials: process.env.CORS_CREDENTIALS !== 'false',
    iamApiUrl: process.env.IAM_API_URL?.replace(/\/$/, '') ?? '',
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