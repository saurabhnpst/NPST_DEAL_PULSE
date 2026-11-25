# Centralized API Documentation (Phase 3)

## Primary interface — API Gateway Swagger Hub

**URL:** `http://localhost:3010/api/docs` (use your `PORT` from `apps/api-gateway/.env`)

- Single Swagger UI with **seven service specs** in the dropdown.
- Each spec is fetched from upstream OpenAPI JSON, then patched so **Try it out** uses:

  `servers[0].url` → `http://localhost:3010/api/v1`

### OpenAPI JSON endpoints (gateway)

| Service | Gateway JSON URL |
|---------|------------------|
| Lead | `/api/openapi/leads.json` |
| Opportunity | `/api/openapi/opportunities.json` |
| RFP | `/api/openapi/rfps.json` |
| Document | `/api/openapi/documents.json` |
| Approval | `/api/openapi/approvals.json` |
| Assignment | `/api/openapi/assignments.json` |
| Compliance | `/api/openapi/compliance.json` |

Implementation: `backend/apps/api-gateway/src/openapi/openapi-hub.ts`

## Per-service Swagger (debugging)

| Service | Port | UI | JSON |
|---------|------|-----|------|
| Lead | 3002 | http://localhost:3002/api/docs | /api/docs-json |
| Opportunity | 3003 | http://localhost:3003/api/docs | /api/docs-json |
| RFP | 3004 | http://localhost:3004/api/docs | /api/docs-json |
| Document | 3005 | http://localhost:3005/api/docs | /api/docs-json |
| Approval | 3006 | http://localhost:3006/api/docs | /api/docs-json |
| Assignment | 3007 | http://localhost:3007/api/docs | /api/docs-json |
| Compliance | 3008 | http://localhost:3008/api/docs | /api/docs-json |

## Gateway route prefixes

All business routes: **`/api/v1/*`** (see `docs/api-gateway-route-matrix.md`).

## Development headers

| Header | Used by |
|--------|---------|
| `x-mock-token` | Approval + Decisions (required in dev) |
| `X-CSRF-Token` | Unsafe methods when Command Module auth is enabled |
| `X-Correlation-Id` | Optional; echoed by gateway |

Generate mock tokens via Approval Service mock codec (see `docs/frontend-integration-contract.md`).

## Try it out through the gateway

1. Open `http://localhost:3010/api/docs`.
2. Select a service in the dropdown.
3. Execute requests — base URL is already `http://localhost:3010/api/v1`.
4. For **Approvals**, use **Authorize** or add header `x-mock-token`.