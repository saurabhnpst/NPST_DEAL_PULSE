# API Gateway Route Matrix

**Gateway port:** `3000` (override with `PORT` in `apps/api-gateway/.env`)

| Gateway prefix | Upstream service | Port |
|----------------|------------------|------|
| `/api/v1/leads` | Lead | 3002 |
| `/api/v1/opportunities` | Opportunity | 3003 |
| `/api/v1/rfps` | RFP | 3004 |
| `/api/v1/documents` | Document | 3005 |
| `/api/v1/uploads` | Document | 3005 |
| `/api/v1/entity-documents` | Document | 3005 |
| `/api/v1/approvals` | Approval | 3006 |
| `/api/v1/decisions` | Approval | 3006 |
| `/api/v1/assignments` | Assignment | 3007 |
| `/api/v1/handoffs` | Assignment | 3007 |
| `/api/v1/requirements` | Assignment | 3007 |
| `/api/v1/product-verticals` | Assignment | 3007 |
| `/api/v1/compliance` | Compliance | 3008 |
| `/api/v1/frameworks` | Compliance | 3008 |
| `/api/v1/assessments` | Compliance | 3008 |
| `/api/v1/configurations` | Compliance | 3008 |
| `/api/auth`, `/api/me`, `/api/public` | Command Module (`IAM_API_URL`) | optional |
| `/health`, `/health/ready` | Gateway (local) | — |

**Implementation:** `apps/api-gateway/src/proxy/gateway-proxy.ts` — longest-prefix router via `http-proxy-middleware` v3.

**Headers forwarded (CORS allowed):** `Content-Type`, `Authorization`, `X-CSRF-Token`, `X-Mock-Token`, `X-Correlation-Id`, `X-Changed-By`, `X-Compliance-Actor-Id`, multipart bodies via `fixRequestBody`.