# Postman API Testing Guide

## Import

1. **Collection:** `docs/postman/DealPulse-Gateway.postman_collection.json`
2. **Environment:** `docs/postman/DealPulse-Gateway.postman_environment.json`

Select environment **DealPulse Local (Gateway)**.

## Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `gatewayBase` | `http://localhost:3010` | Health checks |
| `apiBase` | `http://localhost:3010/api/v1` | Business APIs |
| `approvalMockToken` | empty | `x-mock-token` for approvals |
| `leadId` | empty | Workflow tests |
| `opportunityId` | empty | Workflow tests |

Adjust `gatewayBase` / `apiBase` if your gateway uses another port (`npm run ports:check`).

## Suggested order

1. **Health** → Gateway liveness + readiness
2. **Leads** → List leads → copy id → Working → Assess need → Approve (creates opportunity when opp service healthy)
3. **Opportunities** → List / Create / Get
4. **Compliance** → Frameworks, Assessments
5. **Approvals** → set `approvalMockToken` first

## Evidence from Phase 3 smoke (gateway :3010)

| Request | Status |
|---------|--------|
| GET `/health` | PASS 200 |
| GET `/health/ready` | PASS 200 |
| GET `/api/v1/leads` | PASS 200 |
| GET `/api/v1/opportunities` | PASS 200 |
| GET `/api/v1/rfps` | PASS 200 |
| GET `/api/v1/frameworks` | PASS 200 |
| GET `/api/v1/assignments` | PASS 200 |
| GET `/api/v1/approvals` | PARTIAL without mock token |

## CLI alternative

```bash
GATEWAY=http://localhost:3010 npm --prefix backend run smoke:phase3
```