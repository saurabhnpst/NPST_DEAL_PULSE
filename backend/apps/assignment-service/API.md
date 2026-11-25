# Assignment Service API

Contract for the API gateway, the frontend and other services. Interactive version: **Swagger at `/api/docs`**.

- Base URL: `http://localhost:3007/api/v1` (port: `ASSIGNMENT_SERVICE_PORT`).
- Gateway: forward `/api/v1/product-verticals/**`, `/api/v1/assignments/**`, `/api/v1/requirements/**`, `/api/v1/handoffs/**` unchanged.
- `:opp` = an opportunity's public id, e.g. `OPP-2026-00001` (the Opportunity Service id).

## Conventions (same as the Opportunity Service)

| Topic | Rule |
|---|---|
| Success | `{ "success": true, "data": …, "meta"?: { page, limit, total, totalPages } }` |
| Error | `{ "success": false, "error": { "code", "message", "details"?: string[] } }` |
| Acting user | Header **`x-user-id: <auth user id>`** (set by the gateway). If missing, the body field `changedByUserId` is used. |
| `null` / `""` | `null` clears a value; a top-level `""` is treated as `null` |
| Unknown fields | Dropped silently |
| Dates | `YYYY-MM-DD` |
| Ids | Returned as strings (MySQL BIGINT) |

### Error codes
| HTTP | `code` | When |
|---|---|---|
| 400 | `VALIDATION_ERROR` | Bad input; `details` lists each problem |
| 400 | `BAD_REQUEST` | Rule failed, e.g. wrong status, missing `x-user-id`, inactive user |
| 403 | `FORBIDDEN` | The user lacks the role, e.g. Sales trying to approve |
| 404 | `NOT_FOUND` | Unknown assignment / handoff / requirement / opportunity |
| 409 | `CONFLICT` | Duplicate product in the master; assignment changed meanwhile (reload) |
| 502 / 503 | `BAD_GATEWAY` / `SERVICE_UNAVAILABLE` | Another service (Opportunity, Auth, RFP) failed or is down |
| 500 | `INTERNAL_ERROR` | Bug (logged) |

### Who can do what
| Action | Role needed (from the Auth Service) |
|---|---|
| Approve / change / return a technical assignment | `SOLUTION_MANAGER` |
| Accept / return a handoff | `SOLUTION_MANAGER` |
| Be a handoff's Solutions owner | `PRESALES` |
| Be a Tech Lead | any **active** user |
| Everything else | any user (the gateway controls access) |

---

## 1. Product → Tech Lead master

The default Tech Lead (and vertical) for each product. Used to propose assignments automatically.

| Method & path | Body | Notes |
|---|---|---|
| `GET /product-verticals?activeOnly=true` | — | Sorted by product |
| `GET /product-verticals/:id` | — | |
| `POST /product-verticals` | `productTsp`*, `vertical` (`TSP`/`EVOK`, default TSP), `techLeadUserId`, `active` (default true) | 409 if the product already exists. Tech Lead must be active. |
| `PATCH /product-verticals/:id` | `vertical`, `techLeadUserId` (`null` = no default), `active` | |
| `GET /product-verticals/:id/history` | — | Every change |

Object: `{ id, productTsp, vertical, techLeadUserId, techLeadName, active, updatedByUserId, createdAt, updatedAt }`

## 2. Technical assignments

**One assignment per opportunity + product workstream** (e.g. OPP-2026-00001 + UPI), covering all of that product's requirements.

```
PENDING_APPROVAL ──approve──▶ APPROVED  (Tech Lead notified + added to the opportunity's People)
      │   ▲                      │
   return │ change ◀─────────────┘   change = propose another Tech Lead → PENDING_APPROVAL again (version + 1)
      ▼   │
   RETURNED
```

| Method & path | Body | What happens |
|---|---|---|
| `POST /assignments/opportunity/:opp/requirements` | `{ requirements: [{ requirementRef, title*, details, productTsp, products[] }] }` (1–500) | **Used by the RFP Service.** Saves requirements (a `requirementRef` already received is skipped), classifies them, proposes assignments. Returns `{ added, skippedAsDuplicate, opportunityId, assignments[], reviewQueue[] }`. |
| `POST /assignments/opportunity/:opp/auto-assign` | — | No requirements yet → fetches confirmed ones from the RFP Service. Re-checks review items with one product (e.g. after the master was fixed). Proposes. Same response shape. |
| `POST /assignments/opportunity/:opp` | `productTsp`*, `techLeadUserId`*, `comment` | Manual proposal (e.g. product has no default). Waiting requirements of that product join it. 409 if that product is already APPROVED (use `change`). |
| `GET /assignments/opportunity/:opp` | — | `{ opportunityId, assignments: [ …with requirements[] ], reviewQueue: [] }` |
| `GET /assignments?opportunityId&status&productTsp&techLeadUserId&page&limit` | — | List. Solution Manager queue: `?status=PENDING_APPROVAL`. `techLeadUserId` matches proposed or final lead. |
| `GET /assignments/:id` | — | Assignment + its `requirements[]` |
| `GET /assignments/:id/history` | — | Newest first; each row has a `snapshot` (keeps proposed and final versions) |
| `POST /assignments/:id/approve` | `comment` | **Solution Manager.** Only from PENDING_APPROVAL. Sets the final Tech Lead, notifies them, adds them to the opportunity People as `Tech Lead (<product>)`. May return `warnings[]` if notify/sync failed (the approval still stands). |
| `POST /assignments/:id/change` | `techLeadUserId`*, `comment` | **Solution Manager.** New proposed Tech Lead → PENDING_APPROVAL, version + 1. |
| `POST /assignments/:id/return` | `comment`* | **Solution Manager.** Only from PENDING_APPROVAL → RETURNED. Can be proposed again later. |

Assignment object: `{ id, opportunityId, productTsp, vertical, status, proposedTechLeadUserId, proposedTechLeadName, techLeadUserId, techLeadName, version, proposedByUserId, decidedByUserId, decidedAt, decisionComment, notifiedAt, createdAt, updatedAt, requirements?[] }`

### How a requirement is classified
| Requirement | Status | Goes to |
|---|---|---|
| No product | `UNMAPPED` | Review queue (never auto-assigned) |
| Several products (`products: ["UPI","BBPS"]`) | `NEEDS_REVIEW` | Review queue |
| One product, but no active default Tech Lead in the master | `NEEDS_REVIEW` | Review queue (reason says why) |
| One product with an active default Tech Lead | `MAPPED` | That product's assignment |

## 3. Review queue (requirements)

| Method & path | Body | What happens |
|---|---|---|
| `GET /requirements/review-queue?opportunityId=` | — | UNMAPPED + NEEDS_REVIEW requirements |
| `PATCH /requirements/:id` | `productTsp`* (string, or `null` = not mapped) | Re-classified; if MAPPED it joins (or creates) that product's proposal |
| `GET /requirements/:id/history` | — | |

Requirement object: `{ id, opportunityId, requirementRef, title, details, productTsp, status, reviewReason, technicalAssignmentId, source (API/RFP), createdByUserId, createdAt, updatedAt }`

## 4. Sales → Pre-Sales handoffs

```
REQUESTED ──accept──▶ ACCEPTED ──complete──▶ COMPLETED
   │   ▲
return  resubmit        cancel: from REQUESTED / RETURNED / ACCEPTED
   ▼   │
RETURNED
```

| Method & path | Body | What happens |
|---|---|---|
| `POST /handoffs` | `title`*, `opportunityId`, `leadId`, `synopsisId`, `requestedSupport`, `dueDate`, `pendingInputs[]`, `assigneeUserId` | Sales asks for support (requester = `x-user-id`). Suggested assignee is notified. |
| `GET /handoffs?opportunityId&assigneeUserId&status&page&limit` | — | "My Pre-Sales work": `?assigneeUserId=5` |
| `GET /handoffs/:id`, `GET /handoffs/:id/history` | — | |
| `PATCH /handoffs/:id` | `title`, `opportunityId`, `requestedSupport`, `dueDate`, `pendingInputs` | Linking an opportunity to an ACCEPTED handoff syncs its Pre-Sales owner |
| `POST /handoffs/:id/accept` | `assigneeUserId` (required unless already set), `opportunityId` | **Solution Manager.** Assignee must be PRESALES. If an opportunity is linked → it becomes the opportunity's **Pre-Sales owner** and is added to People as `Pre-Sales`. |
| `POST /handoffs/:id/return` | `note`* | **Solution Manager.** Back to Sales with questions. |
| `POST /handoffs/:id/resubmit` | `note` | Sales answered → REQUESTED |
| `POST /handoffs/:id/complete` | `note` | ACCEPTED → COMPLETED |
| `POST /handoffs/:id/cancel` | `note` | |

Handoff object: `{ id, opportunityId, leadId, synopsisId, title, requestedSupport, status, requestedByUserId, requestedByName, assigneeUserId, assigneeName, dueDate, pendingInputs[], returnNote, acceptedAt, completedAt, createdAt, updatedAt }`

## 5. Health
`GET /health` → `{ status, database, integrations: { auth, notification, rfp, opportunity } }`. Each integration is `"real"` or `"mock"`.

## 6. Events (outbox)
Written to `assignment_domain_events` in the same transaction as the change (`published_at IS NULL` = not yet sent; the RabbitMQ publisher comes later).
Envelope: `{ eventId, eventType, schemaVersion: 1, occurredAt, producer: "assignment-service", payload: { subjectType, subjectId, opportunityId, … } }`

| Event | When | Extra payload |
|---|---|---|
| `RfpRequirementsReceived` | Requirements saved | `count`, `source` |
| `TechnicalAssignmentProposed` | Proposed / re-proposed / changed | `productTsp`, `proposedTechLeadUserId`, `version` |
| `TechnicalAssignmentCreated` | **Approved** (name from the team's event catalogue) | `productTsp`, `techLeadUserId`, `techLeadName`, `version` |
| `TechnicalAssignmentReturned` | Returned | `productTsp`, `reason` |
| `PresalesHandoffRequested` | Created / resubmitted | `title`/`status`, `assigneeUserId` |
| `PresalesHandoffAccepted` / `Returned` / `Completed` | Status change | `status`, `assigneeUserId`, `comment` |

## 7. What this service calls
| Service | Call | Env (empty = mock) |
|---|---|---|
| Opportunity | `GET /api/v1/opportunities/:id`, `PATCH /api/v1/opportunities/:id/contributors` | `OPPORTUNITY_SERVICE_URL` |
| Auth | `GET /api/v1/users/:id` → `{ id, name, active, roles[] }` | `AUTH_SERVICE_URL` |
| RFP | `GET /api/v1/rfp/opportunities/:opp/requirements` → `[{ requirementRef, title, details, productTsp, products[] }]` | `RFP_SERVICE_URL` |
| Notification | `POST /api/v1/notifications` with `{ toUserId, toName, kind, title, message, link }` | `NOTIFICATION_SERVICE_URL` |

The `x-user-id` header is passed on to every call.
