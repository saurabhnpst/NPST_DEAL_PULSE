# Executive Summary

**Analysis date:** 2026-11-25 · **Method:** Read-only repository inspection (no live DB, no service starts).

---

## What have we built?

- A **full-featured React demo** of the NPST sales workflow (10+ screens, vertical roles, local persistence).
- **Three substantial NestJS services**: Lead (CRUD + lifecycle), Document (upload/scan/MinIO/versions), RFP (PDF pipeline, extraction, review).
- An **API Gateway** that proxies business APIs and Command Module auth routes.
- **Command Module integration scaffolding** (frontend login, backend session guard library).
- **Infrastructure templates** (MySQL, Redis, RabbitMQ, MinIO/LocalStack, ClamAV).
- **Eight microservice shells** with health checks and env templates for future domains.

## What is working?

| Area | Evidence |
|------|----------|
| Lead/Document/RFP **APIs** | Controllers, services, migrations, unit tests in repo |
| Frontend **demo** | Store + seed + navigation |
| **Auth login path** (when IAM running) | `authService` + gateway proxy |
| **document_db** as single document DB | Config + consolidation documentation |
| **Builds** | Documented in prior dev work (not re-run in this pass) |

## What is partially implemented?

- API Gateway (proxy only).
- Authentication (client + guards; enforcement optional; VERTICALS still authorizes UI).
- Lead lifecycle (stops at log-only Approval/Opportunity integrations).
- RFP backend vs RFP frontend (backend deep, frontend mock).
- Environment configuration (per-service templates; multi-process startup).

## What is missing?

- Opportunity, Approval, Assignment, Compliance **business APIs**.
- Frontend connection to Lead/Document/RFP APIs.
- IAM DealPlus **permission catalog**.
- Event-driven integration (RabbitMQ unused).
- Delivery, Notification, Reporting, in-repo Auth.
- Production deployment artifacts.

## Which services are ready?

| Ready for integration | Not ready |
|------------------------|-----------|
| Lead, Document, RFP | Opportunity, Approval, Assignment, Compliance |
| API Gateway (basic) | auth-service, delivery, notification, reporting |

## Critical blockers

1. **UI is disconnected** from implemented backends (except login).
2. **Half the gateway routes** target empty services.
3. **Session auth not enforced** without Redis + IAM ops.
4. **MinIO/blob layer** must match environment for document downloads (**NOT VERIFIED** in this pass).

## Is the frontend connected to real APIs?

**No** for business data. **Yes** for Command Module authentication (`authService`).

## Is authentication integrated?

**Partially.** Login/session flows are implemented; authorization uses demo verticals; backend guards pass through without `REDIS_SERVICE_URL`.

## Is the database architecture consistent?

**Mostly yes** after `document_db` consolidation (documented). One DB per service is defined; only Lead/Document/RFP have schemas in code. Stubs assert `DB_*` but have no migrations.

## Can the application run end to end?

**Not as a unified product today.** You can run **demo UI offline**, or **individual APIs** with manual env. A full deal flow across UI and microservices is **not** achievable without Phase 1–3 roadmap work.

---

## Top 10 tasks to make it fully functional

| # | Task | Priority |
|---|------|----------|
| 1 | Wire **Leads** and **LeadDetail** to Lead Service via gateway | P0 |
| 2 | Register **DealPlus permissions** in Command Module + enable `REDIS_SERVICE_URL` | P0 |
| 3 | Implement **Opportunity Service** (CRUD + link to leads) | P0 |
| 4 | Implement **Approval Service** + connect Lead lifecycle HTTP | P0 |
| 5 | Replace **RfpExtract** mock with Document upload + RFP APIs | P1 |
| 6 | Implement **Assignment** + **Compliance** services (MVP) | P1 |
| 7 | Map UI permissions to **`me.permissions`**, retire VERTICALS-only auth | P1 |
| 8 | Add **CI integration tests** (gateway + lead + document) | P1 |
| 9 | **Dockerize** or script full stack startup (IAM + gateway + services + S3) | P1 |
| 10 | Implement **Pre-PO / Post-PO** backend or defer with explicit PRD scope | P2 |

---

**Full detail:** [README](./README.md) · [Gap matrix](./10-implementation-gaps.md) · [Roadmap](./13-implementation-roadmap.md)