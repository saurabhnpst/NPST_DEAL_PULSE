# Opportunity Service: Team Guide

Owner: `<your name>` · Code: `backend/apps/opportunity-service` · Full contract: [`../API.md`](../API.md)

## At a glance

| Item | Value |
|---|---|
| Service | `opportunity-service` (NestJS 10, TypeORM, MySQL 8) |
| Port / prefix | `3005` · `/api/v1` |
| Database | `opportunity_db` (owned by this service only) |
| Health | `GET /api/v1/health` → `{ status, database }` |
| Start | `npm run start:opportunities` (from `backend/`) |
| Migrate | `npm run opp:migrate` |
| Tests | `npm run test:opportunities` |
| Ids accepted in URLs | numeric `id` or public id `OPP-YYYY-NNNNN` |

## Setup (5 minutes)
1. `cd backend && npm install`
2. `.env` in `backend/` or the repo root, **not committed**:
   `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=opportunity_db`, `DB_SSL_MODE=REQUIRED` (Aiven).
3. `npm run opp:migrate`, then `npm run start:opportunities`.
4. `curl localhost:3005/api/v1/health` → `"database":"connected"`.

Details and troubleshooting: [`RUNNING.md`](./RUNNING.md).

## What other services need to know

### API Gateway
- Forward `/api/v1/opportunities` and `/api/v1/opportunities/**` to `http://<host>:3005` with the **same path**.
- After checking the JWT, set the header **`x-user-id: <auth user id>`**. It's stored as `createdByUserId`, `lastModifiedByUserId` and in stage history.
- Pass the response through unchanged.

### Response and error format (same for every endpoint)
```json
{ "success": true,  "data": { }, "meta": { "page": 1, "limit": 20, "total": 3, "totalPages": 1 } }
{ "success": false, "error": { "code": "VALIDATION_ERROR", "message": "Validation failed", "details": ["sow must be one of: Yes, No"] } }
```
| Code | HTTP | Meaning |
|---|---|---|
| `VALIDATION_ERROR` | 400 | Bad input; `details` lists each problem |
| `BAD_REQUEST` | 400 | Business rule failed, e.g. "Fill these first" + missing field labels |
| `INVALID_VALUE` | 400 | Value rejected by the database |
| `NOT_FOUND` | 404 | No such opportunity, or it was deleted |
| `CONFLICT` / `CONCURRENT_UPDATE` | 409 | Duplicate / changed at the same moment (retry) |
| `INTERNAL_ERROR` | 500 | Bug (logged) |

### Input rules
- PATCH: send only the changed fields. `null` clears a value; `""` counts as empty; unknown fields are ignored.
- Money: send numbers; DECIMAL values come back as strings (`"1500000.00"`). Dates: `YYYY-MM-DD`.
- `stage` only changes through the stage endpoints.

### Ids from other services (stored as given, no foreign keys)
| Field | Owner service | Checked? |
|---|---|---|
| `ownerUserId`, `presalesUserId` | Auth | If `AUTH_SERVICE_URL` is set: `GET /api/v1/users/:id` must return 2xx |
| `poFileDocumentId` | Document | If `DOCUMENT_SERVICE_URL` is set: `GET /api/v1/documents/:id` must return 2xx |
| `leadId`, `accountId` | Lead | Not checked yet |

With `OPPORTUNITY_STRICT_EXT_REFS=true`, a failed check rejects the request; otherwise the response includes `warnings[]`.

## API list

Base: `/api/v1`. `:id` = numeric id or `OPP-YYYY-NNNNN`.

### Opportunity
| Method | Path | Purpose |
|---|---|---|
| POST | `/opportunities` | Create. Required: `name`, `accountName`, `closeDate`, `arr`, `products[]`. Optional `stage` (open stages), `currency` (INR/USD) and any field |
| GET | `/opportunities` | List. `page`, `limit≤100`, `search`, `stage`, `owner`, `accountId`, `account`, `product` |
| GET | `/opportunities/pipeline` | Pipeline totals by open stage |
| GET | `/opportunities/:id` | One opportunity (all fields + calculated `_` values) |
| PATCH | `/opportunities/:id` | Update any fields; `products[]` replaces all slots |
| DELETE | `/opportunities/:id` | Soft delete |

### Stages
| Method | Path | Body |
|---|---|---|
| GET | `/opportunities/:id/stages` | Current stage, probability, next stage |
| POST | `/opportunities/:id/stages/:stageId/complete` | Dry run → `{ ready, issues[] }` |
| POST | `/opportunities/:id/stages/:stageId/proceed` | `:stageId` = current stage name, slug or 0–4 |
| POST | `/opportunities/:id/hold` | `holdReason`, `holdDetails`, `holdUntil?` |
| POST | `/opportunities/:id/reopen` | `stage`, `plan`, `comment`, `suggestion?` |
| POST | `/opportunities/:id/close-won` | `poDate`, `poValue`, `projectStartActual?`, `firstBillingDate?`, `firstBillingValue?` |
| POST | `/opportunities/:id/close-lost` | `lostReason`, `lostReasonRemark?` |
| POST | `/opportunities/:id/close-no-bid` | — |
| PATCH | `/opportunities/:id/fallback` | `plan`, `comment`, `suggestion?` (On Hold plan, no stage move) |

Closing while early-stage tasks are open also needs `overrideReason` and `overrideJustification`.

### Sections
| Method | Path | Purpose |
|---|---|---|
| GET / PATCH | `/opportunities/:id/revenue` | ARR, one-time, year 2–5, follow-up dates → `_amount`, `_tcv` |
| GET / PATCH | `/opportunities/:id/contributors` | `ownerUserId`, `presalesUserId`, `presalesName`, `dealTeam[]` |
| GET / PUT | `/opportunities/:id/products` | Product slots 1–4 + modules |
| GET / PATCH | `/opportunities/:id/commercials` | `lines[]` (`{id,t,q,p[]}`), `licence`, `milestones`, `amcTerm` |
| POST | `/opportunities/:id/commercials/versions` | Save a version (`versionLabel?`) |
| POST | `/opportunities/:id/po-receipt` | `poNumber`, `poDate`, `poValue?`, `poFileDocumentId?` |
| GET / POST | `/opportunities/:id/activities` | Log Call / Meeting / Email / Note |
| GET | `/opportunities/:id/history` | Timeline: stage moves + activities |
| GET | `/health` | Service + database status |

### Stages and picklists
- Stages: `Qualification`, `Needs Analysis`, `Impact Analysis`, `Proposal`, `Negotiation`, `Closed Won`, `Closed Lost`, `No Bid`, `On Hold`.
- Hold reasons: `Internal`, `External`, `Both(Internal & External)`.
- Lost reasons: `Change in Priorities`, `Competition`, `Customer went cold`, `Price`, `Product Fitment`, `Project Cancelled`, `Technically Not Qualified`, `Others`.
- Yes/No fields take `Yes` / `No`.

## Events (for Notification, Reporting, Assignment)
Written to the `opportunity_domain_events` outbox in the same transaction as the change. **Publishing to RabbitMQ is not built yet**; the exchange and queue names still need agreeing.

| Event | Payload (besides `opportunityId`, `publicId`) |
|---|---|
| `OpportunityCreated` | `stage` |
| `OpportunityUpdated` | `fields[]` |
| `OpportunityStageChanged` | `fromStage`, `toStage` |
| `OpportunityCommercialRevised` | `versionLabel` |
| `OpportunityPoReceived` | `poNumber`, `poDate`, `poValue` |
| `OpportunityActivityLogged` | `activityId`, `activityKind` |
| `OpportunityDeleted` | — |

Envelope: `{ eventId, eventType, schemaVersion: 1, occurredAt, producer: "opportunity-service", correlationId?, payload }`. Consumers should be idempotent on `eventId`.

## Needed from teammates
| From | What |
|---|---|
| Gateway | Route `/api/v1/opportunities/**` → `:3005`, set `x-user-id` |
| Auth | `GET /api/v1/users/:id` (2xx if the user exists); later, roles for edit permissions |
| Document | `GET /api/v1/documents/:id` (2xx if the document exists) |
| Lead / RFP | Agree the conversion flow: call `POST /opportunities` with `leadId`, or emit `SynopsisAccepted` |
| Everyone | RabbitMQ exchange naming + event envelope (above) |
| Frontend | `opportunityMappers.js` / `opportunitySync.js` send only ~20 Details fields today; the API accepts all of them |

## Rules we keep
- Never read or write another service's database; use its API or events.
- Don't commit `.env` or `ca.pem`.
- Schema changes go through migrations (`npm run opp:migrate`). `synchronize` stays off.
