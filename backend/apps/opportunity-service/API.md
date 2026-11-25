# Opportunity Service API

The contract for the API gateway, the frontend and other services.

- **Base URL:** `http://localhost:3005/api/v1`. Set the port with `OPPORTUNITY_SERVICE_PORT`.
- **Gateway:** forward `/api/v1/opportunities/**` to this service unchanged.
- **`:id`:** either the numeric `id` or the public id `OPP-YYYY-NNNNN`.

## Conventions

| Topic | Rule |
|---|---|
| Success | `{ "success": true, "data": …, "meta"?: { page, limit, total, totalPages } }` |
| Error | `{ "success": false, "error": { "code", "message", "details"?: string[] } }` |
| Acting user | Header `x-user-id: <auth user id>`, set by the gateway after it checks the token. If it's missing, the body's `changedByUserId` (or `actorUserId` for activities) is used. |
| Missing field | Left unchanged (PATCH) or default value (create) |
| `null` | Clears the field, except `name`, `accountName`, `closeDate`, `currency`, `arr`, `oneTime` and checkboxes |
| `""` (top-level) | Treated as `null`, so empty form inputs work |
| Unknown fields | Dropped silently |
| Numbers | Send JSON numbers. DECIMAL fields come back as strings, e.g. `"1500000.00"` |
| Dates | `YYYY-MM-DD` (a full ISO timestamp is accepted; only the date is kept) |

### Error codes

| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Body or query fails validation; `details` lists each problem |
| 400 | `BAD_REQUEST` | A business rule failed, e.g. proceed with missing fields (`details` = missing labels) |
| 400 | `INVALID_VALUE` | The database rejected a value (too long / out of range) |
| 404 | `NOT_FOUND` | Opportunity doesn't exist or was deleted |
| 409 | `CONFLICT` | Duplicate unique value |
| 409 | `CONCURRENT_UPDATE` | Another request changed it at the same moment; retry |
| 500 | `INTERNAL_ERROR` | Bug: details are in the service log |

## The opportunity object

Returned by GET one, list items, create, PATCH, stage actions, `PATCH /contributors`, `POST /po-receipt` and `PATCH /fallback`.

- **Identity:** `id`, `publicId`, `stage`, `products[]` (`{ id, productSlot 1–4, productTsp, modules[] }`).
- **Editable fields:** every field in `EDITABLE_FIELDS` in `src/opportunities/opportunity-fields.ts`, i.e. the frontend Details tab plus `stageTasks[]` and `dealTeam[]`.
- **Set by workflows (read-only):**
  - Stage actions: `holdFrom`, `holdAt`, `reopenedAt`, `holdFallbacks[]`, `closedValue`, `earlyClose`, `overrideReason`, `overrideJustification`.
  - Commercials: `licence`, `milestones`, `amcTerm`, `currentCommercialLines[]`.
  - PO receipt: `poNumber`, `poFileDocumentId`.
  - Audit: `createdByUserId`, `lastModifiedByUserId`, `createdAt`, `updatedAt`, `deletedAt`.
- **Calculated (never stored):**

| Field | Meaning |
|---|---|
| `_prob`, `_forecast` | Probability % and forecast category for the stage |
| `_vertical` | `EVOK` when `recordType` is `PPAS`, else `TSP` |
| `_amount` | `arr + oneTime` (first-year amount) |
| `_tcv` | `_amount + year2…year5` |
| `_totalArr` | `updatedArr` if set, else `arr` |
| `_category` | `CAT 1`…`CAT 5` by `_amount` |
| `_fy27Q1`…`_fy27Q4`, `_fy27` | FY27 phasing: Q1 entered directly; Q2–Q4 are month sums |

Stages: `Qualification → Needs Analysis → Impact Analysis → Proposal → Negotiation` (open), then `Closed Won`, `Closed Lost`, `No Bid`, `On Hold`.

## Endpoints

### Opportunities
| Method & path | Body / query | Returns |
|---|---|---|
| `POST /opportunities` | Required: `name`, `accountName`, `closeDate`, `arr`, `products[]` (1–4). Optional: `stage` (open stages only, default Qualification), `currency` (`INR`/`USD`, default INR), any editable field | Opportunity (201) |
| `GET /opportunities` | `page`, `limit` (≤100), `search` (name / account / public id), `stage`, `owner`, `accountId`, `account`, `product` | Opportunity[] + `meta` |
| `GET /opportunities/pipeline` | — | `{ openCount, pipelineValue, weightedPipeline, byStage[] }` |
| `GET /opportunities/:id` | — | Opportunity |
| `PATCH /opportunities/:id` | Any editable fields; `products[]` replaces all slots. `stage` is ignored | Opportunity |
| `DELETE /opportunities/:id` | — | `{ id, publicId, deletedAt }` (soft delete) |

### Stage actions
All of these run in a transaction on a locked row, write a stage-history row and an `OpportunityStageChanged` event. `changedByUserId` is optional in every body.

| Method & path | Body | Rule |
|---|---|---|
| `GET /opportunities/:id/stages` | — | Current stage, `_prob`, `_forecast`, `nextOpenStage`, `canProceed` |
| `POST /opportunities/:id/stages/:stageId/complete` | — | Dry run: `{ ready, issues[] }` |
| `POST /opportunities/:id/stages/:stageId/proceed` | — | Moves to the next open stage once the required fields and open tasks are done. `:stageId` = current stage name, slug or index 0–4 |
| `POST /opportunities/:id/hold` | `holdReason` (Internal / External / Both(Internal & External)), `holdDetails`, `holdUntil?` | From open stages only |
| `POST /opportunities/:id/close-won` | `poDate`, `poValue > 0`, `projectStartActual?`, `firstBillingDate?`, `firstBillingValue?` | Sets `poReceived = Yes`, `closeDate = poDate` |
| `POST /opportunities/:id/close-lost` | `lostReason`, `lostReasonRemark?` | |
| `POST /opportunities/:id/close-no-bid` | — | |
| `POST /opportunities/:id/reopen` | `stage` (open stage), `plan`, `comment`, `suggestion?` | From On Hold only; adds a `Reopened` fallback entry |
| `PATCH /opportunities/:id/fallback` | `plan`, `comment`, `suggestion?` | Adds a `Fallback` entry without moving the stage |

Closing (won / lost / no bid) while early-stage tasks are still open also needs `overrideReason` and `overrideJustification`. Allowed reasons are in `src/stages/stage-definitions.ts`.

### Sections of the record
| Method & path | Body | Returns |
|---|---|---|
| `GET/PATCH /opportunities/:id/revenue` | `arr`, `oneTime`, `updatedArr`, `year2…year5`, `updatedCloseDate`, `latestFollowupDate`, `followupDetails` | Revenue view with `_amount`, `_tcv`, `dealCategory` |
| `GET /opportunities/:id/contributors` | — | `{ ownerUserId, presalesUserId, presalesName, dealTeam[] }` |
| `PATCH /opportunities/:id/contributors` | Same fields | Opportunity (+ `warnings[]` if Auth Service couldn't verify a user) |
| `GET/PUT /opportunities/:id/products` | `{ products[] }`: unique slots; modules must match the product | Product[] |
| `GET /opportunities/:id/commercials` | — | `{ lines[], versions[], licence, milestones, amcTerm, totalByVersion[], currentVersionIndex }` |
| `PATCH /opportunities/:id/commercials` | `lines[]` (`{ id, t, q, p[] }`, same number of prices per line), `licence`, `milestones`, `amcTerm` | Commercials view |
| `POST /opportunities/:id/commercials/versions` | `versionLabel?` | Commercials view: snapshot saved, one new price column |
| `POST /opportunities/:id/po-receipt` | `poNumber`, `poDate`, `poValue?` (defaults to the latest commercial total), `poFileDocumentId?` | Opportunity (+ `warnings[]`) |
| `GET /opportunities/:id/activities` | — | Activity[] (newest first) |
| `POST /opportunities/:id/activities` | `activityKind` (Call / Meeting / Email / Note / System), `summary`, `withParty?`, `occurredAt?`, `actorLabel?` | Created activity (201) |
| `GET /opportunities/:id/history` | — | Timeline `[{ kind, t, m, at }]`: stage moves and activities, newest first |
| `GET /health` | — | `{ status, database }` |

## Events (outbox)

Each change also inserts a row in `opportunity_domain_events` in the same transaction. Rows with `published_at IS NULL` haven't been sent yet. A RabbitMQ publisher (not built yet) will send them and set `published_at`.

Envelope (`payload` column): `{ eventId, eventType, schemaVersion: 1, occurredAt, producer: "opportunity-service", correlationId?, payload: { opportunityId, publicId, … } }`

| Event | Extra payload |
|---|---|
| `OpportunityCreated` | `stage` |
| `OpportunityUpdated` | `fields[]` (names that were sent) |
| `OpportunityStageChanged` | `fromStage`, `toStage` |
| `OpportunityCommercialRevised` | `versionLabel` |
| `OpportunityPoReceived` | `poNumber`, `poDate`, `poValue` |
| `OpportunityActivityLogged` | `activityId`, `activityKind` |
| `OpportunityDeleted` | — |

## Ids owned by other services

`leadId`, `accountId`, `ownerUserId`, `presalesUserId`, `poFileDocumentId` are stored as given. There are no cross-database foreign keys.

If `AUTH_SERVICE_URL` / `DOCUMENT_SERVICE_URL` are set, user and document ids are checked against those services. With `OPPORTUNITY_STRICT_EXT_REFS=true`, a failed check rejects the request; otherwise it returns a warning.
