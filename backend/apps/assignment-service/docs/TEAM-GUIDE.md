# Assignment Service: Team Guide

Owner: `<your name>` · Code: `backend/apps/assignment-service` · Contract: [`../API.md`](../API.md) · Swagger: `/api/docs`

## At a glance
| Item | Value |
|---|---|
| What | Product → Tech Lead master, technical assignments with Solution Manager approval, review queue, Sales → Pre-Sales handoffs |
| Stack | NestJS 10, TypeORM, MySQL 8 (same as the other services) |
| Port / prefix | `3007` · `/api/v1` |
| Database | `assignment_db` (this service only) |
| Start / migrate / test | `npm run start:assignments` · `npm run asg:migrate` · `npm run test:assignments` |
| Health | `GET /api/v1/health`: database + which integrations are real or mock |

Setup details: [`RUNNING.md`](./RUNNING.md). Design: [`ARCHITECTURE.md`](./ARCHITECTURE.md).

## Format (same as the Opportunity Service)
```json
{ "success": true,  "data": { }, "meta": { "page": 1, "limit": 50, "total": 3, "totalPages": 1 } }
{ "success": false, "error": { "code": "FORBIDDEN", "message": "Priya S. cannot approve technical assignments (needs role SOLUTION_MANAGER)" } }
```
Error codes: `VALIDATION_ERROR`, `BAD_REQUEST`, `FORBIDDEN`, `NOT_FOUND`, `CONFLICT`, `BAD_GATEWAY`, `SERVICE_UNAVAILABLE`, `INTERNAL_ERROR`.

## API list
| Method | Path | Purpose |
|---|---|---|
| GET/POST | `/product-verticals` | Product → vertical → default Tech Lead master |
| GET/PATCH | `/product-verticals/:id` (+ `/history`) | |
| POST | `/assignments/opportunity/:opp/requirements` | **RFP Service sends confirmed requirements here** |
| POST | `/assignments/opportunity/:opp/auto-assign` | Pull requirements (if none) + propose default Tech Leads |
| POST | `/assignments/opportunity/:opp` | Manual proposal for a product |
| GET | `/assignments/opportunity/:opp` | Assignments + review queue of an opportunity |
| GET | `/assignments?status=PENDING_APPROVAL` | Solution Manager queue (filters: opportunityId, status, productTsp, techLeadUserId) |
| GET | `/assignments/:id` (+ `/history`) | |
| POST | `/assignments/:id/approve` · `/change` · `/return` | Solution Manager decisions |
| GET | `/requirements/review-queue` | Unmapped / unclear requirements |
| PATCH | `/requirements/:id` | Set a requirement's product |
| GET/POST | `/handoffs` | Sales → Pre-Sales requests ("my work": `?assigneeUserId=`) |
| GET/PATCH | `/handoffs/:id` (+ `/history`) | |
| POST | `/handoffs/:id/accept` · `/return` · `/resubmit` · `/complete` · `/cancel` | Handoff lifecycle |
| GET | `/health` | |

Statuses: assignments `PENDING_APPROVAL → APPROVED / RETURNED`; requirements `MAPPED / UNMAPPED / NEEDS_REVIEW`; handoffs `REQUESTED → ACCEPTED → COMPLETED`, `RETURNED`, `CANCELLED`.

## What other teams need to provide (integration checklist)

| Team | What we expect | Set this env on the Assignment Service |
|---|---|---|
| **API Gateway** | Route `/api/v1/product-verticals/**`, `/assignments/**`, `/requirements/**`, `/handoffs/**` → `:3007`; set **`x-user-id`** after the JWT check | — |
| **Auth** | `GET /api/v1/users/:id` → `{ id, name, active, roles[] }` with roles `SOLUTION_MANAGER`, `PRESALES`, `TECH_LEAD`, `SALES` (names can be mapped in `src/integrations/users.client.ts`) | `AUTH_SERVICE_URL` |
| **RFP** | Either **push**: call `POST /assignments/opportunity/:opp/requirements` after confirmation (preferred), or **pull**: expose `GET /api/v1/rfp/opportunities/:opp/requirements` → `[{ requirementRef, title, details, productTsp, products[] }]` | `RFP_SERVICE_URL` (pull only) |
| **Notification** | `POST /api/v1/notifications` with `{ toUserId, toName, kind, title, message, link }`, or consume our events | `NOTIFICATION_SERVICE_URL` |
| **Opportunity** (ours) | Already integrated: `GET /opportunities/:id`, `PATCH /opportunities/:id/contributors` | `OPPORTUNITY_SERVICE_URL` |
| **Frontend** | Screens: Solution Manager queue, review queue, handoff accept/return (RFP synopsis page "Accept handover"), Tech Leads in People (already shown) | — |

Until a URL is set, a **mock** is used (see `src/integrations/*.client.ts`), so nobody is blocked.

## Events we publish (outbox → RabbitMQ later)
`RfpRequirementsReceived`, `TechnicalAssignmentProposed`, `TechnicalAssignmentCreated` (approved), `TechnicalAssignmentReturned`,
`PresalesHandoffRequested`, `PresalesHandoffAccepted`, `PresalesHandoffReturned`, `PresalesHandoffCompleted`.
Envelope: `{ eventId, eventType, schemaVersion, occurredAt, producer: "assignment-service", payload }`. Consumers should be idempotent on `eventId`.

## Rules we keep
- Never read or write another service's database; use its API.
- The Opportunity Service stays the source of truth for owner / Pre-Sales owner / People; we update it through its API.
- Schema changes go through migrations; `schema.sql` and the migration must match (a test checks this).
- Don't commit `.env` or `ca.pem`.
