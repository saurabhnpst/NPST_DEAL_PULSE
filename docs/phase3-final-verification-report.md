# Phase 3 — Final Verification Report

**Date:** 2026-11-25  
**Gateway:** `http://localhost:3010` (verified)  
**Database policy:** No drops/truncates; existing seven DB names preserved.

## Deliverables completed

| Item | Status |
|------|--------|
| `npm run start:backend` (concurrently) | **PASS** — implemented |
| `npm run stop:backend` | **PASS** — pid file stop |
| `npm run ports:check` | **PASS** |
| Central Swagger hub `/api/docs` | **PASS** (2026-11-25) |
| Postman collection | **PASS** — `docs/postman/` |
| Phase 3 smoke script | **PASS** |
| Opportunity env fix (`opportunity_db`) | **PASS** (Phase 2 carryover) |
| Lead → Opportunity HTTP | **PASS** (curl approve test) |
| Startup guide | **PASS** — `docs/local-application-startup-guide.md` |

## Backend service matrix

| Service | Port | Startup | DB | Gateway proxy | OpenAPI hub |
|---------|------|---------|-----|---------------|-------------|
| API Gateway | 3010 | PASS | N/A | — | PASS |
| Lead | 3002 | PASS | lead_db | PASS | PASS |
| Opportunity | 3003 | PASS | opportunity_db | PASS | PASS |
| RFP | 3004 | PASS | rfp_db | PASS | PASS |
| Document | 3005 | PASS | document_db | NOT TESTED upload | PASS |
| Approval | 3006 | PASS | approval_db (TypeORM) | PARTIAL (mock token) | PASS |
| Assignment | 3007 | PASS | assignment_db | PASS | PASS |
| Compliance | 3008 | PASS | compliance_db | PASS | PASS |

## Remaining gaps (honest)

| Area | Status | Notes |
|------|--------|-------|
| Document upload E2E | **NOT TESTED** | Needs `infra:up` + document `.env` |
| RFP Redis workers | **NOT TESTED** | Needs Redis + worker process |
| Approval mock token UX | **PARTIAL** | Generate token + set `VITE_APPROVAL_MOCK_TOKEN` |
| RFP synopsis UI | **PARTIAL** | Local store, not full RFP DTO mapping |
| Decisions / Compliance UI | **PARTIAL** | Mix of API + legacy local matrix |
| Port 3000 | **BLOCKED** | Foreign app; use 3010 |

## Tests executed (automated)

```bash
GATEWAY=http://localhost:3010 npm --prefix backend run smoke:phase3
```

Result: 9 PASS, 1 PARTIAL (approvals without token).

## Manual verification

**Not performed by automation** — owner runs checklist in `docs/final-demo-readiness-report.md`.