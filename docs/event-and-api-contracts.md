# Event and API Contracts (as implemented)

## HTTP (cross-service)

| Caller | Callee | Contract location | Notes |
|--------|--------|-------------------|-------|
| RFP | Document | `apps/rfp-service/src/clients/document-service.client.ts` | Download/upload metadata |
| Assignment | Opportunity | `apps/assignment-service/src/integrations/opportunity.client.ts` | Mock fixtures if no URL |
| Assignment | RFP | `apps/assignment-service/src/integrations/rfp.client.ts` | Mock mode |
| Lead | Approval | `apps/lead-service/src/integrations/approval.integration.ts` | **No HTTP yet** |
| Lead | Opportunity | `apps/lead-service/src/integrations/opportunity.integration.ts` | **No HTTP yet** |

## Domain events (in-process / planned)

| Service | Event types | Transport | Status |
|---------|-------------|-----------|--------|
| Approval | `approval.submitted.v1`, `approval.decided.v1`, … | `InMemoryApprovalEventPublisher` | **MOCK** |
| Assignment | Domain events entity | DB table | **PARTIAL** |
| Opportunity | `OpportunityDomainEvent` | DB | **PARTIAL** |
| RabbitMQ | — | — | **NOT WIRED** |

See `apps/approval-service/docs/openapi.yaml` for approval envelope fields (`producer`, `correlationId`, etc.).

## Gateway contract (Phase 2 frontend)

- **Base URL:** `http://localhost:3000` (when port free)
- **Prefix:** `/api/v1/...` for business APIs
- **Auth (later):** `/api/auth`, `/api/me` via IAM (optional Phase 1)
- **Approval dev:** `x-mock-token` header required