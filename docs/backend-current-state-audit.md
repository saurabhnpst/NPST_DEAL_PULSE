# Backend Current State Audit (Phase 1)

**Date:** 2026-11-25

## Monorepo

- **Nest CLI:** 12 apps under `backend/apps/`
- **In scope:** api-gateway + 7 domain services (ports 3000, 3002–3008)
- **Out of scope:** auth, delivery, notification, reporting (health shells only)

## Already working (code + local smoke)

| Area | Evidence |
|------|----------|
| All 7 services boot | Nest “successfully started” on 3002–3008 when `apps/<svc>/.env` present |
| MySQL connectivity | Lead GET returned persisted rows (existing data preserved) |
| Compliance TLS fix | `DB_SSL_MODE=DISABLED` avoids forced CA in dev |
| Opportunity port | Default listen **3003** (`OPPORTUNITY_SERVICE_PORT`) |
| Gateway routes expanded | Frameworks, assessments, handoffs, assignments, etc. |

## Incomplete / known gaps

| Gap | Severity |
|-----|----------|
| Gateway port **3000** often in use (non-DealPulse process) | Demo blocker |
| Gateway proxy required **Express hybrid** bootstrap (fixed in `main.ts`) | Fixed |
| Approval **in-memory** persistence | Product gap |
| Lead → Opportunity / Approval | HTTP **stubs** (log only) |
| Document uploads | Require **MinIO + ClamAV** running |
| RFP async jobs | Require **Redis** |
| Command Module IAM | Optional for Phase 1 business APIs |

## Per-service snapshot

| Service | Controllers | Migrations | Deps |
|---------|-------------|------------|------|
| Lead | CRUD + lifecycle + qualification | Yes | MySQL |
| Opportunity | Full pipeline surface | Yes | MySQL |
| RFP | CRUD + PDF + extraction | Yes | MySQL, Redis, Document HTTP |
| Document | Uploads, versions, attachments | Yes | MySQL, MinIO, ClamAV |
| Approval | Approvals, decisions | Yes (unused at runtime) | MySQL env only; in-memory data |
| Assignment | Assignments, handoffs, requirements | Yes | MySQL; mock HTTP clients |
| Compliance | Frameworks → sign-offs | Yes | MySQL |
| API Gateway | Health + proxy | N/A | Upstream URLs |

## Environment layout

- Per-service: `backend/apps/<service>/.env` (gitignored)
- Templates: `apps/<service>/.env.example`, root `backend/.env.example`
- **Do not** commit secrets; copy connection settings per service with correct `DB_NAME`