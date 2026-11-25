# Implementation Status and Gap Analysis

Legend: **IMPLEMENTED** | **PARTIAL** | **MOCK** | **MISSING** | **NOT VERIFIED**

## Component matrix

| Component | Status | Notes |
|-----------|--------|-------|
| Frontend UI (all screens) | **IMPLEMENTED** | Demo-quality, rich UX |
| Frontend → business APIs | **MISSING** | Only auth connected |
| Store / seed persistence | **IMPLEMENTED** | localStorage demo |
| API Gateway | **PARTIAL** | Proxy + CORS; no edge auth |
| Command Module auth client | **PARTIAL** | Frontend yes; backend passthrough w/o Redis |
| Lead Service | **IMPLEMENTED** | Cross-service stubs log-only |
| Document Service | **IMPLEMENTED** | Blobs depend on MinIO env |
| RFP Service | **IMPLEMENTED** | Heavy; needs Redis + binaries for full PDF |
| Opportunity Service | **MOCK** | Health only |
| Approval Service | **MOCK** | Health only |
| Assignment Service | **MOCK** | Health only |
| Compliance Service | **MOCK** | Health only |
| Auth Service (in-repo) | **PLACEHOLDER** | Superseded by Command Module |
| Delivery / Notification / Reporting | **PLACEHOLDER** | Health / dirs |
| RabbitMQ integration | **MISSING** | Infra only |
| libs/messaging | **MISSING** | Empty |
| libs/security JWT | **MISSING** | Empty |
| IAM DealPlus permissions | **MISSING** | External team |
| E2E tests (full product) | **NOT VERIFIED** | RFP integration env-gated |
| Dockerized microservices | **MISSING** | |

## Prioritized technical gaps

### P0 — blocks production or integration

| # | Gap |
|---|-----|
| P0-1 | Frontend uses Store/seed—not Lead/Document/RFP APIs |
| P0-2 | Opportunity, Approval, Assignment, Compliance have no domain APIs |
| P0-3 | Command Module session enforcement off without `REDIS_SERVICE_URL` |
| P0-4 | IAM permissions / vertical mapping not registered for DealPlus |
| P0-5 | No single local runbook that starts IAM + gateway + 3+ services + MinIO reliably |

### P1 — major product completeness

| # | Gap |
|---|-----|
| P1-1 | Lead lifecycle → Approval/Opportunity integrations are stubs |
| P1-2 | RFP UI entirely mock; backend capable |
| P1-3 | Gateway routes to stubs return 404 on business paths |
| P1-4 | Authorization in UI is VERTICALS mock, not `me.permissions` |
| P1-5 | Identity on Lead writes (`x-changed-by`) not tied to session user |

### P2 — quality and operations

| # | Gap |
|---|-----|
| P2-1 | Document Service lacks integration/e2e tests in CI |
| P2-2 | RabbitMQ unused—events not propagated |
| P2-3 | No Nest apps in Docker for QA environments |
| P2-4 | API catalogue documents many unbuilt endpoints |

### P3 — future / inactive scope

| # | Gap |
|---|-----|
| P3-1 | Delivery, Notification, Reporting services |
| P3-2 | In-repo auth-service |
| P3-3 | Reporting read models |

## Services “readiness” summary

| Service | Ready for API consumers? | Ready for UI integration? |
|---------|--------------------------|-------------------------|
| API Gateway | Partial | N/A |
| Lead | **Yes** (with auth caveats) | No wiring |
| Document | **Yes** (with MinIO/ClamAV) | No wiring |
| RFP | **Yes** (complex deps) | No wiring |
| Opportunity | **No** | No |
| Approval | **No** | No |
| Assignment | **No** | No |
| Compliance | **No** | No |