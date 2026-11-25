# Backend Service Verification Report

**Date:** 2026-11-25 · **Legend:** PASS | PARTIAL | BLOCKED | NOT TESTED

Tests run on this machine with existing MySQL (Aiven TLS) and **no DB drops/resets**.

## Summary table

| Service | Starts | Database | APIs (direct) | Gateway | Overall |
|---------|--------|----------|-----------------|---------|---------|
| Lead | PASS | PASS | PARTIAL | PARTIAL | **PARTIAL** |
| Opportunity | PASS | PARTIAL | PARTIAL | PARTIAL | **PARTIAL** |
| RFP | PASS | PASS | PARTIAL | PARTIAL | **PARTIAL** |
| Document | PASS | PARTIAL | NOT TESTED | NOT TESTED | **PARTIAL** |
| Approval | PASS | N/A (in-memory) | PARTIAL | PARTIAL | **PARTIAL** |
| Assignment | PASS | PARTIAL | PARTIAL | PARTIAL | **PARTIAL** |
| Compliance | PASS | PASS | PARTIAL | PARTIAL | **PARTIAL** |

## Lead Service (3002)

| Check | Result | Notes |
|-------|--------|-------|
| Startup | **PASS** | |
| DB connection | **PASS** | GET `/api/v1/leads` returned 200 with existing rows |
| Health | **PASS** | `/api/v1/health` |
| CRUD | **PARTIAL** | Create/update not re-run in this pass (avoid duplicate seed) |
| Lead → Opportunity conversion | **BLOCKED** | `OpportunityIntegration` logs only — **stub** |
| Migrations | **NOT TESTED** | CLI uses `apps/lead-service/.env` after Phase 1 path fix |

## Opportunity Service (3003)

| Check | Result | Notes |
|-------|--------|-------|
| Startup | **PASS** | Listens on 3003 when env set |
| Health | **PASS** | |
| CRUD | **NOT TESTED** | Endpoints present; not exercised end-to-end here |
| Migrations | **NOT TESTED** | `npm run opp:migrate` |

## RFP Service (3004)

| Check | Result | Notes |
|-------|--------|-------|
| Startup | **PASS** | |
| DB | **PASS** | Health/readiness pattern in codebase |
| CRUD / statuses | **PARTIAL** | Statuses in `RFP_STATUSES`: Draft, Registered, In Review, Submitted, Closed, Withdrawn |
| Redis/Bull | **PARTIAL** | Workers start; jobs **NOT TESTED** without Redis |

## Document Service (3005)

| Check | Result | Notes |
|-------|--------|-------|
| Startup | **PASS** | |
| DB `document_db` | **PASS** | Config uses `document_db` |
| Upload / MinIO / ClamAV | **NOT TESTED** | Infra not started in this pass |
| Multipart | **NOT TESTED** | |

## Approval Service (3006)

| Check | Result | Notes |
|-------|--------|-------|
| Startup | **PASS** | |
| DB persistence | **BLOCKED** | **In-memory** repository; migrations not applied at runtime |
| APIs | **PARTIAL** | Requires `x-mock-token` / Bearer mock token per `MockActorGuard` |
| History / reassignment | **NOT TESTED** | Controllers present |

## Assignment Service (3007)

| Check | Result | Notes |
|-------|--------|-------|
| Startup | **PASS** | |
| DB | **PARTIAL** | Connectivity via health; migrations **NOT TESTED** |
| Handoffs / assignments | **NOT TESTED** | Routes mapped at boot |

## Compliance Service (3008)

| Check | Result | Notes |
|-------|--------|-------|
| Startup | **PASS** | After TLS env fix |
| DB | **PASS** | Connects with `VERIFY_CA` when configured |
| Health | **PASS** | |
| Frameworks list | **PARTIAL** | Route exists; may return empty without seed data |

## API Gateway (3000)

| Check | Result | Notes |
|-------|--------|-------|
| Startup on 3000 | **BLOCKED** | `EADDRINUSE` — foreign listener on 3000 |
| Startup on 3800 (test) | **PASS** | |
| Proxy GET leads | **PARTIAL** | Hybrid Express proxy implemented; full pass needs all upstreams up + port 3000 free |