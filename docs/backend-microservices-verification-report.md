# DealPulse Backend Microservices — Independent Verification Report

**Date:** 2025-11-25  
**Scope:** Lead, Opportunity, Assignment, RFP, Document, Approval, Compliance (no API Gateway, no frontend, no production auth implementation)  
**Environment:** Local `dealplus-mysql` (Docker), `dealpulse-redis`, object storage on port `9000` (non–`dealplus-minio` compose stack; MinIO client succeeded from Document Service), ClamAV via `dealpulse-documents-clamav`

---

## Executive summary

| Service | Starts | DB connected | Migrations | APIs tested | Persistence | Overall |
|--------|--------|--------------|------------|-------------|-------------|---------|
| Lead | PASS | PASS | PASS | PASS | PASS | **PASS** |
| Opportunity | PASS | PASS | PASS | PASS | PASS | **PASS** |
| Assignment | PASS | PASS | PASS | PASS | PASS | **PASS** |
| RFP | PASS | PASS | PASS | PARTIAL | PASS | **PARTIAL** |
| Document | PASS | PASS* | PASS | PARTIAL | PARTIAL | **PARTIAL** |
| Approval | PASS | PASS | PASS | PASS | PASS | **PASS** |
| Compliance | FAIL | NOT TESTED | PASS | NOT TESTED | NOT TESTED | **BLOCKED** |

\*Document Service connects when `DB_SSL_CA` is not set (see configuration notes).

**Backend readiness for API Gateway wiring:** **PARTIAL**. Five services (Lead, Opportunity, Assignment, Approval, and core RFP CRUD) are independently operable against local MySQL with documented env overrides. Document Service is operable after clearing committed `.env` TLS settings and confirming MinIO/ClamAV endpoints. Compliance Service is **blocked** on local/docker MySQL until TLS configuration matches other services (`DB_SSL_MODE` / optional `DB_SSL_CA`).

---

## Phase 1 — Backend structure (from code and configuration)

| Service | Directory | Entry | Start script (`backend/package.json`) | Default port | Database | ORM | Health route |
|--------|-----------|-------|--------------------------------------|--------------|----------|-----|--------------|
| Lead | `backend/apps/lead-service` | `src/main.ts` | `npm run start:leads` | `3002` (`PORT`) | `lead_db` | TypeORM | `GET /api/v1/health` |
| Opportunity | `backend/apps/opportunity-service` | `src/main.ts` | `npm run start:opportunities` | `3005` (`OPPORTUNITY_SERVICE_PORT` or `PORT`) | `opportunity_db` | TypeORM | `GET /api/v1/health` (+ DB probe) |
| Assignment | `backend/apps/assignment-service` | `src/main.ts` | `npm run start:assignments` | `3007` (`ASSIGNMENT_SERVICE_PORT`) | `assignment_db` | TypeORM | `GET /api/v1/health` |
| RFP | `backend/apps/rfp-service` | `src/main.ts` | `npm run start:rfp` | `3004` (`PORT`) | `rfp_db` | TypeORM | `GET /api/v1/health` |
| Document | `backend/apps/document-service` | `src/main.ts` | `npm run start:documents` | `3005` (`PORT`) | `document_db` | TypeORM | `GET /api/v1/health` |
| Approval | `backend/apps/approval-service` | `src/main.ts` | `npm run start:approvals` | `3006` (`PORT`) | `approval_db` | TypeORM | `GET /api/v1/health` |
| Compliance | `backend/apps/compliance-service` | `src/main.ts` | `npm run start:compliance` | `3008` (`PORT`) | `compliance_db` | TypeORM | `GET /api/v1/health` |

**Shared stack:** NestJS 10 monorepo (`nest start <app>`), MySQL 8.4, TypeORM migrations per service, global prefix `api/v1` (Swagger at `api/docs` where configured).

**Migration scripts (root `package.json`):** `migration:lead:*`, `migration:run` / `migration:show` (document), `migration:run:rfp`, `opp:migrate*`, `asg:migrate*`, `migration:run:approval`. Compliance migrations are run via TypeORM data source under `apps/compliance-service/src/database/`.

**Schema status (local MySQL table counts):** `lead_db` 4, `opportunity_db` 8, `assignment_db` 7, `rfp_db` 12, `document_db` 4, `approval_db` 5, `compliance_db` 11.

**Migration execution notes (non-destructive):**

- Schemas for all seven databases were applied on this host (CLI or `ts-node` runners). Document migrations applied via explicit `DataSource` paths when `npm run migration:run` failed due to TLS env from `backend/.env` / `DB_SSL_CA`.
- Lead and RFP CLI data sources default `DB_SSL_CA` to `./ca.pem`; local runs require omitting `DB_SSL_CA` or using `DB_SSL_MODE=DISABLED` (Opportunity/Assignment pattern).
- Compliance **requires** `DB_SSL_CA` in config validation and always enables MySQL TLS in `app.module.ts`.

**Environment files present:** `apps/document-service/.env`, `apps/rfp-service/.env` (gitignored). Others rely on `.env.example` or inline env for local runs.

**Port conflict:** Opportunity default `3005` matches Document default `PORT=3005`; run Opportunity with `OPPORTUNITY_SERVICE_PORT=3003` (or similar) when both are up.

---

## Phase 2 — Per-service verification

### Lead Service

| Item | Result |
|------|--------|
| **Startup** | `npx nest start lead-service` with `DB_*` → `lead_db`, `PORT=3002`, `REDIS_SERVICE_URL=` |
| **DB** | `lead_db`, TypeORM, migrations present |
| **Independence** | MySQL only; `DealplusAuthModule` uses passthrough guard when session Redis unset |

**Routes exercised**

| Method | Route | HTTP | Notes |
|--------|-------|------|-------|
| GET | `/api/v1/health` | 200 | `status: ok` |
| POST | `/api/v1/leads` | 201 | Create with dev email |
| GET | `/api/v1/leads/:id` | 200 | Round-trip |
| GET | `/api/v1/leads` | 200 | List |
| PATCH | `/api/v1/leads/:id` | 200 | `company` updated |
| GET | `/api/v1/leads/:id` (unknown UUID) | 404 | |
| DELETE | `/api/v1/leads/:id` | 204 | Soft-delete test record |

**Service-specific:** Lead → opportunity conversion is **not** integrated: `OpportunityIntegration.convertLeadToOpportunity` logs only (`integration pending`). Lifecycle routes (`assess-need`, `approve`, `working`) exist but were not full-path tested in this run.

**Overall:** **PASS**

---

### Opportunity Service

| Item | Result |
|------|--------|
| **Startup** | `OPPORTUNITY_SERVICE_PORT=3003`, `DB_SSL_MODE=DISABLED`, `DB_NAME=opportunity_db` |
| **DB** | Health reports `database: connected` |

**Routes exercised**

| Method | Route | HTTP |
|--------|-------|------|
| GET | `/api/v1/health` | 200 |
| POST | `/api/v1/opportunities` | 201 |
| GET | `/api/v1/opportunities/:id` | 200 |
| GET | `/api/v1/opportunities` | 200 |
| PATCH | `/api/v1/opportunities/:id` | 200 |
| DELETE | `/api/v1/opportunities/:id` | (test cleanup) |
| GET | `/api/v1/opportunities/not-a-uuid` | 400 |

**Service-specific:** Create requires `name`, `accountName`, `closeDate`, `arr`, `products[]`. Lead linkage fields exist on entity/DTOs; no cross-service HTTP call required for CRUD.

**Overall:** **PASS**

---

### Assignment Service

| Item | Result |
|------|--------|
| **Startup** | `ASSIGNMENT_SERVICE_PORT=3007`, `DB_SSL_MODE=DISABLED`, `assignment_db` |
| **DB** | Health `database: connected` |

**Routes exercised**

| Method | Route | HTTP |
|--------|-------|------|
| GET | `/api/v1/health` | 200 |
| POST | `/api/v1/handoffs` | 201 |
| GET | `/api/v1/handoffs/:id` | 200 |
| GET | `/api/v1/handoffs` | 200 |
| GET | `/api/v1/assignments` | 200 |

**Service-specific:** Technical assignment flows (`POST .../requirements`, approvals) depend on opportunity IDs and downstream workflow; list/create handoff paths persist without other microservices running.

**Overall:** **PASS**

---

### RFP Service

| Item | Result |
|------|--------|
| **Startup** | `PORT=3004`, `DB_NAME=rfp_db`; unset `DB_SSL_CA` for local |
| **DB** | Connected; 12 tables |
| **Extra deps** | `BullModule` → Redis (`REDIS_HOST`/`REDIS_PORT` in `.env.example`); Document Service HTTP config for document workflows |

**Routes exercised**

| Method | Route | HTTP | Notes |
|--------|-------|------|-------|
| GET | `/api/v1/health` | 200 | |
| POST | `/api/v1/rfps` | 201 | |
| GET | `/api/v1/rfps/:id` | 200 | |
| GET | `/api/v1/rfps` | 200 | |
| PATCH | `/api/v1/rfps/:id` | 400 | Test used invalid status `In Progress`; allowed values: `Draft`, `Registered`, `In Review`, `Submitted`, `Closed`, `Withdrawn` |
| DELETE | `/api/v1/rfps/:id` | (cleanup) | |

**Overall:** **PARTIAL** (CRUD and persistence verified; PATCH validation not re-tested with valid enum; PDF/extraction queues not exercised)

---

### Document Service

| Item | Result |
|------|--------|
| **Startup** | `PORT=3005`, **`DB_NAME=document_db`** (confirmed; not legacy `dealplus_documents`) |
| **DB** | Fails if `apps/document-service/.env` sets `DB_SSL_CA` against non-TLS local MySQL; succeeds with `DB_SSL_CA` cleared |
| **MinIO** | `MINIO_*` to `127.0.0.1:9000`; bucket `dealplus-documents` created on startup |
| **ClamAV** | Scan reached `CLEAN` on test upload |

**Routes exercised**

| Method | Route | HTTP | Notes |
|--------|-------|------|-------|
| GET | `/api/v1/health` | 200 | Does not report DB/storage status |
| GET | `/api/v1/documents` | 200 | |
| GET | `/api/v1/documents/:id` (missing) | 404 | |
| POST | `/api/v1/uploads` | 201 | Multipart; metadata + version persisted; test file removed via `DELETE ...?force=true` |

**Overall:** **PARTIAL** (end-to-end upload works with correct env; committed `.env` TLS breaks local DB; health check shallow)

---

### Approval Service

| Item | Result |
|------|--------|
| **Startup** | `PORT=3006`, `approval_db`, `DB_SSL_MODE=DISABLED`, `APPROVAL_MOCK_TOKEN_SECRET` |
| **Persistence** | TypeORM `approval_db` (not in-memory) |
| **Auth (verification only)** | `x-mock-token` HMAC (fixtures: e.g. `actor-sales-rep`) — excluded from “implement auth” scope |

**Routes exercised**

| Method | Route | HTTP |
|--------|-------|------|
| GET | `/api/v1/health` | 200 |
| POST | `/api/v1/approvals` | 201 |
| GET | `/api/v1/approvals/:id` | 200 |
| GET | `/api/v1/approvals` | 200 |
| GET | `/api/v1/approvals` (no token) | 403 |

**Overall:** **PASS** (status transitions beyond submit not fully exercised in this run)

---

### Compliance Service

| Item | Result |
|------|--------|
| **Startup** | **FAIL** — TypeORM retries then exit |
| **Error** | `Error: self-signed certificate in certificate chain` when using `DB_SSL_CA=./ca.pem` (Aiven CA) against local MySQL without matching TLS |
| **Schema** | `compliance_db` migrated (11 tables); runtime not verified |

**Routes exercised:** none (service did not listen).

**Overall:** **BLOCKED** on local/docker MySQL until SSL configuration is aligned with other services.

---

## Phase 3 — Service-specific checklist (summary)

| Area | Finding |
|------|---------|
| Lead creation/retrieval/status | PASS |
| Lead → opportunity conversion | Stub only (no HTTP to Opportunity Service) |
| Opportunity CRUD / pipeline fields | PASS on create/list/get/patch |
| Assignment handoff + list assignments | PASS |
| RFP CRUD / status enums | PASS create/read/list; PATCH needs valid `RFP_STATUSES` |
| Document metadata / versions | Upload creates version 1; list/get/delete verified |
| Document DB name | `document_db` |
| Approval DB | `approval_db`, submit + read PASS |
| Compliance create/assessments | NOT TESTED (startup blocked) |

---

## Phase 4 — Dependency isolation

| Service | Runs without other microservices? | MySQL | Redis | RabbitMQ / Bull | MinIO | Other |
|---------|-----------------------------------|-------|-------|-----------------|-------|-------|
| Lead | Yes | Required | Optional (session); passthrough if empty | No | No | `DealplusAuthModule` |
| Opportunity | Yes | Required | No hard dependency in app module | Outbox only (no publisher required to start) | No | Loads `backend/.env` if present |
| Assignment | Yes | Required | No | Outbox only | No | |
| RFP | Yes* | Required | Bull root config uses Redis — **Redis must be reachable to boot** | Workers/queues not required for basic RFP CRUD | No | Optional HTTP to Document Service for document flows |
| Document | Yes* | Required | Optional auth | No | **Required for upload** | ClamAV for scan on upload |
| Approval | Yes | Required | Optional auth module | In-memory event publisher (no RabbitMQ required) | No | Mock token guard on API |
| Compliance | No (local) | Required + **TLS CA** | No | No | No | |

\*Verified in this environment with Redis and MinIO/ClamAV available.

**API Gateway / Auth:** Not required for the HTTP tests above. Production guards remain TBD per service.

---

## Phase 5 — Errors, missing dependencies, required fixes

### Prioritized fixes before API Gateway integration

1. **Compliance Service — local/docker TLS (P0)**  
   Mirror Opportunity/Assignment: optional `DB_SSL_CA`, `DB_SSL_MODE=DISABLED` for local MySQL. Today `getOrThrow('DB_SSL_CA')` and forced `ssl: { ca, rejectUnauthorized: true }` prevent local startup.

2. **Document & RFP committed `.env` / migration CLI (P0)**  
   Remove or comment `DB_SSL_CA` in local `.env` files when using `dealplus-mysql` without TLS. Fix `npm run migration:run` (document) and lead/rfp CLI data sources that default `./ca.pem`.

3. **Opportunity vs Document port defaults (P1)**  
   Document `.env.example` and Opportunity default both use `3005`. Standardize ports in examples (`OPPORTUNITY_SERVICE_PORT=3003`, Document `3005`).

4. **Lead → Opportunity integration (P1)**  
   Replace log-only `OpportunityIntegration` with configured HTTP/event contract before gateway exposes conversion.

5. **RFP async workers (P2)**  
   Document Redis dependency for Bull; optional graceful degradation if Redis down (today startup may fail).

6. **Compliance assessments API (P2)**  
   After TLS fix, seed or document required `configurationId` for `POST /assessments`.

7. **Infrastructure parity (P2)**  
   Root `docker-compose.yml` MinIO/RabbitMQ images were not fully up; local verification used existing Redis and port-9000 storage. Align compose with Document/RFP expectations for repeatable dev.

### Non-blocking observations

- RFP `PATCH` returned 400 for invalid status during automated test (expected validation).
- Approval OpenAPI text may still mention “no HTTP submit”; implementation includes `POST /approvals`.
- Document health does not surface DB/MinIO status (monitoring gap).

---

## Verification methodology

- Services started one at a time: `npx nest start <service>` from `backend/` with explicit `DB_*` and service ports.
- HTTP tests via `curl`/fetch; only verification-created leads, opportunities, handoffs, RFPs, approvals, and one document upload were removed after testing.
- No database drops/resets; no gateway or auth implementation changes.
- Automated log bundle: `/tmp/dealpulse-verify-results.json` (same host, 2025-11-25).

---

## Overall backend readiness assessment

| Criterion | Status |
|-----------|--------|
| Core CRM path (Lead + Opportunity) independently runnable | **Yes** |
| Pre-Sales path (Assignment handoffs, RFP records) | **Mostly yes** (RFP workers/Document S2S optional) |
| Documents on `document_db` + object storage | **Yes with env fix** |
| Approvals on `approval_db` | **Yes** (mock token for dev) |
| Compliance | **No** until TLS/config fix |
| Safe default for Gateway phase | Integrate **Lead, Opportunity, Assignment, Approval, RFP (read/write core), Document** behind routing and env templates; **exclude or stub Compliance** until P0 fix lands |

**Recommended gate for API Gateway work:** resolve **P0** items (Compliance TLS, document/rfp local `DB_SSL_CA`), publish a shared **local `.env.example` matrix** per service, then proceed with gateway route mapping and contract tests against the five **PASS** services plus Document/RFP with documented env.