# Phase 2 — Backend Remediation & Frontend Integration Report

**Date:** 2026-11-25  
**Scope:** Close Phase 1 gaps, gateway verification, React ↔ gateway wiring (in progress).

## Executive summary

| Area | Status | Notes |
|------|--------|-------|
| Approval persistence | **PASS (code)** | `TypeOrmApprovalRepository` + `approval_db`; verify with `migration:run:approval` + restart test |
| Lead → Opportunity HTTP | **IMPLEMENTED** | `OpportunityIntegration` POSTs to Opportunity Service; rolls back lead on failure |
| API Gateway | **PARTIAL** | Fixed Express bootstrap + proxy pathname routing; **port 3000 occupied by non-gateway app** |
| Opportunity Service APIs | **BLOCKED** | List/create return 500 despite DB “connected” — blocks conversion E2E |
| Document / RFP / Redis | **NOT VERIFIED** | This pass focused on gateway + lead/opp + frontend layer |
| Frontend ↔ gateway | **PARTIAL** | Leads/opps/RFPs/approvals load layer; Lead detail approve/submit/save wired; synopsis/decisions/compliance still UI-local |

## 1. Approval Service persistence

- **Finding:** Current source already uses TypeORM (`buildDataSourceOptions`, `TypeOrmApprovalRepository`). Phase 1 “in-memory” note is **outdated** for this branch.
- **Action required for demo:** Run `npm run migration:run:approval`, restart service, submit/approve/reject via gateway with `x-mock-token`, confirm rows in `approval_db`.

## 2. Lead → Opportunity conversion

**Implementation:** `backend/apps/lead-service/src/integrations/opportunity.integration.ts`

- HTTP `POST {OPPORTUNITY_SERVICE_URL}/api/v1/opportunities`
- Maps lead company/name, `productTsp`, default stage `Qualification`, 90-day close, zero ARR
- On failure: `ServiceUnavailableException`, `LeadLifecycleService` restores prior approval/status
- Env: `OPPORTUNITY_SERVICE_URL` in `apps/lead-service/.env.example`

**Business mapping gaps (needs product decision):**

| Lead field | Opportunity DTO | Note |
|------------|-----------------|------|
| `lead.id` (UUID) | `leadId` (numeric ref) | Not sent — type mismatch |
| Owner / presales | `ownerUserId` | Not mapped from lead `ownerId` UUID |
| ARR / volume | `arr`, `yearlyVolumeProjection` | Defaults to 0; lead volumes not copied |
| Post-conversion link | Lead entity | No `opportunityId` column — UI `oppId` stays client-side unless Opportunity API queried |

**E2E test (2026-11-25):** Blocked because Opportunity Service `GET/POST /api/v1/opportunities` returned **500** on this environment.

## 3. API Gateway

**Fixes applied:**

1. `import * as express from 'express'` — fixes runtime `express is not a function`.
2. `requestPathname()` in `gateway-proxy.ts` — HPM v3 was passing full URL to router; caused `No upstream for http://localhost:…/api/v1/leads`.

**Port 3000:** Responds **401 Unauthorized** (Grafana-style JSON), **not** DealPlus gateway. Gateway verified on **3010** after `PORT=3010 npm run start:gateway`.

**Verified via gateway (3010):**

- `GET /health` → 200
- `GET /health/ready` → all seven upstreams OK
- `GET /api/v1/leads?limit=1` → 200 (proxied)

## 4. Frontend integration (this pass)

| Module | Status |
|--------|--------|
| Central client | `apiClient.js` — timeouts, error bodies, `apiUpload`, `VITE_APPROVAL_MOCK_TOKEN` header |
| Leads | List/create (existing); detail **submit** → `assess-need`, **approve** → `approve`, **save** → PATCH |
| Opportunities | **New opportunity** → `opportunityService.create` (no local `ADD_OPP` only) |
| Business data | Loads leads, opps, **rfps**, **approvals** into store (`SET_RFPS`, `SET_API_APPROVALS`) |
| RFP synopsis UI | Still local `synopses` in store — not mapped to `rfp-service` DTOs |
| Decisions / compliance / assignments pages | Services stubbed; pages not fully wired |
| Mock data | Seed arrays removed; dual-approver UI fields remain local-only for rework/reject |

**Demo config:** Copy `frontend/.env.example` → `.env`. If gateway is not on 3000, set `VITE_API_BASE_URL` to the gateway port (e.g. `http://localhost:3010/api/v1`).

## 5. Remaining work for full Phase 2 sign-off

1. **Free or reassign port 3000** (identify owning process; do not kill unknown processes without approval).
2. **Fix Opportunity Service 500** on list/create (check migrations, schema, server logs).
3. **Restart lead-service** after pulling integration changes; re-test `POST /leads/:id/approve` → opportunity row.
4. **Document upload** via gateway multipart (`/api/v1/uploads`) with MinIO + ClamAV.
5. **RFP workers** — Redis queue smoke (job create/process/fail).
6. **Wire** Compliance, Assignment, Decisions, RFP synopsis screens to gateway APIs.
7. **Remove** local-only approval/recommendation flows or sync with Approval Service.

## 6. Commands (quick retest)

```bash
# Gateway (if 3000 busy)
cd backend && PORT=3010 npm run start:gateway

curl http://localhost:3010/health/ready
curl "http://localhost:3010/api/v1/leads?limit=1"

# Restart lead-service after code changes
cd backend && npm run start:leads
```