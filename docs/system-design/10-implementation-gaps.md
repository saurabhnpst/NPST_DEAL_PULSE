# Implementation Status and Gap Analysis

Legend: **IMPLEMENTED** | **PARTIAL** | **MOCK / PLACEHOLDER** | **MISSING** | **NOT VERIFIED**

Analysis reflects merged `main` (Opportunity, Assignment, Compliance, Approval Scope 1, RFP) as of **2026-11-25**.

## Component matrix

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend UI (screens) | **IMPLEMENTED** | 10+ routes, rich UX |
| Frontend → business APIs | **MISSING** | Service modules exist; pages use Store only |
| Store / seed persistence | **IMPLEMENTED** | `localStorage` demo |
| API Gateway | **PARTIAL** | Proxy + CORS; compliance path mismatch |
| Command Module (frontend) | **PARTIAL** | Login/session; vertical RBAC mock |
| Command Module (backend guards) | **PARTIAL** | Passthrough without `REDIS_SERVICE_URL` |
| Lead Service | **IMPLEMENTED** | Integrations **stub** |
| Document Service | **IMPLEMENTED** | Needs MinIO/ClamAV env |
| RFP Service | **IMPLEMENTED** | Redis + optional PDF binaries |
| Opportunity Service | **IMPLEMENTED** | Not wired to UI |
| Assignment Service | **IMPLEMENTED** | External clients often **mock** |
| Compliance Service | **IMPLEMENTED** | Not reachable via current gateway prefix |
| Approval Service | **PARTIAL** | APIs + **in-memory** persistence |
| Auth Service (in-repo) | **PLACEHOLDER** | Superseded by Command Module |
| Delivery / Notification / Reporting | **PLACEHOLDER** | Health only |
| RabbitMQ | **MISSING** in code | Compose only |
| libs/messaging | **MISSING** | Empty |
| libs/security JWT | **MISSING** | Empty |
| IAM DealPlus permissions | **MISSING** | External IAM team |
| Dockerized Nest apps | **MISSING** | Infra compose only |
| E2E product workflow | **NOT VERIFIED** | Per-service tests exist |

## Service readiness (for API consumers / UI)

| Service | API consumer ready? | UI wired? | Blockers |
|---------|---------------------|-----------|----------|
| API Gateway | Partial | N/A | Compliance routes; no edge auth |
| Lead | Yes (with auth caveat) | No | UI wiring; integration stubs |
| Document | Yes (with MinIO/ClamAV) | No | Blob env |
| RFP | Yes (complex deps) | No | Redis, workers |
| Opportunity | Yes | No | UI wiring |
| Assignment | Yes | No | Mock upstream URLs |
| Compliance | Yes (direct port) | No | Gateway prefix |
| Approval | Dev / Scope 1 | No | In-memory; mock token |

## Prioritized gaps

### P0 — blocks integration phases 2–4

| # | Gap |
|---|-----|
| P0-1 | **Frontend pages do not call** `leadService`, `opportunityService`, etc. |
| P0-2 | **Compliance gateway** does not proxy `/frameworks`, `/assessments`, … |
| P0-3 | **Command Module** session enforcement off without `REDIS_SERVICE_URL` |
| P0-4 | **Lead → Approval / Opportunity** integrations are log-only |
| P0-5 | No **single runbook** for IAM + gateway + 7+ services + MinIO + Redis |

### P1 — product completeness

| # | Gap |
|---|-----|
| P1-1 | Approval **persistence** in-memory vs `approval_db` migrations |
| P1-2 | RFP UI entirely **mock** while backend is capable |
| P1-3 | Frontend **VERTICALS** permissions ≠ IAM `me.permissions` |
| P1-4 | Assignment **mock** users/notifications until real URLs |
| P1-5 | Pre-PO / Post-PO **no backend** |

### P2 — quality and ops

| # | Gap |
|---|-----|
| P2-1 | RabbitMQ unused — no domain events |
| P2-2 | Multi-service **CI smoke** via gateway |
| P2-3 | Nest apps not containerized for QA |
| P2-4 | API catalogue documents **unbuilt** endpoints |

## Configuration problems (verified in templates)

| Issue | Where |
|-------|--------|
| Per-service `.env` required but easy to omit | `loadServiceEnv('rfp-service')`, gateway, etc. |
| Opportunity port ambiguity | `OPPORTUNITY_SERVICE_PORT` vs `PORT` in `main.ts` |
| `backend/.env.example` mixed legacy comments | Consolidation ongoing |
| Document DB name | Must use `document_db` post-consolidation |