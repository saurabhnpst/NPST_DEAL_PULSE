# assignment-service

NestJS service for DealPlus assignments (PRD US-15 and Step 5):

- **Technical assignments:** Product → default Tech Lead master, RFP requirements grouped per product,
  Solution Manager approval, review queue for unmapped requirements.
- **Sales → Pre-Sales handoffs:** Solutions owner, status, due date, pending inputs.

Port **3007**, prefix `/api/v1`, Swagger at **`/api/docs`**, database **`assignment_db`**.

- **API contract:** [API.md](./API.md)
- **Architecture** (+ plain-language overview): [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **How to run** (with a curl walkthrough): [docs/RUNNING.md](./docs/RUNNING.md) · **For teammates:** [docs/TEAM-GUIDE.md](./docs/TEAM-GUIDE.md)

> Status: complete (technical assignments + handoffs). Real Auth / RFP / Notification plug in by env URL when those services exist.

## Endpoints (all under `/api/v1`, send `x-user-id`)

| Area | Endpoints |
|---|---|
| Product → Tech Lead master | `GET/POST /product-verticals`, `GET/PATCH /product-verticals/:id`, `GET …/:id/history` |
| Technical assignments | `GET /assignments` (filters), `GET /assignments/opportunity/:opp`, `POST /assignments/opportunity/:opp/requirements`, `POST …/auto-assign`, `POST /assignments/opportunity/:opp` (manual), `GET /assignments/:id`, `GET …/:id/history`, `POST /assignments/:id/approve \| change \| return` (Solution Manager) |
| Review queue | `GET /requirements/review-queue`, `PATCH /requirements/:id` (set product), `GET /requirements/:id/history` |
| Pre-Sales handoffs | `GET/POST /handoffs`, `GET/PATCH /handoffs/:id`, `GET …/:id/history`, `POST /handoffs/:id/accept \| return` (Solution Manager), `POST …/resubmit \| complete \| cancel` |

## Run (from `backend/`)

```bash
npm run asg:migrate          # create / update tables in assignment_db
npm run start:assignments    # start with watch
npm run test:assignments     # tests (no database needed)
curl localhost:3007/api/v1/health
```

## Configuration (`.env` in `backend/` or the repo root)

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_SSL_MODE` | Shared MySQL connection (override with `ASSIGNMENT_DB_*`) |
| `ASSIGNMENT_DB_NAME` | Database name. Default `assignment_db`. **The shared `DB_NAME` is ignored on purpose.** |
| `ASSIGNMENT_SERVICE_PORT` | Port, default 3007 |
| `ASSIGNMENT_DB_MIGRATE` | `true` = run pending migrations on startup |

## Other services: mock now, real later

Each dependency is one file in `src/integrations/`: a contract (abstract class), a `Mock…` and an `Http…` version.
**Set the URL and the real service is used. Leave it empty and the mock is used.** No code change.
`GET /api/v1/health` shows which one is active.

| Env variable | Service | Used for | Mock behaviour |
|---|---|---|---|
| `OPPORTUNITY_SERVICE_URL` (e.g. `http://localhost:3005`) | Opportunity | Check the opportunity exists; set its Pre-Sales owner; add Tech Leads to "People" | Any `OPP-YYYY-NNNNN` exists, changes kept in memory |
| `AUTH_SERVICE_URL` | Auth | User exists, is active, has the right role | Demo users 1–9 (`users.client.ts`) |
| `NOTIFICATION_SERVICE_URL` | Notification | Tell the Tech Lead / assignee | Logged and kept in memory |
| `RFP_SERVICE_URL` | RFP | Confirmed requirements for an opportunity | Sample requirements (mapped, unmapped, multi-product) |

Calls to other services pass on the `x-user-id` header. Errors: 404 → "not found", service down → 503, other errors → 502.

## Database (`database/schema.sql`, same SQL as the migration)

| Table | Holds |
|---|---|
| `product_tech_leads` | Product → vertical → default Tech Lead (master data) |
| `technical_assignments` | One per opportunity + product: proposed / final Tech Lead, status, version |
| `rfp_requirements` | RFP requirements, their product (or none = review queue) |
| `presales_handoffs` | Sales → Pre-Sales handoff: assignee, status, due date, pending inputs |
| `assignment_history` | Every action, with a snapshot (keeps proposed and final versions) |
| `assignment_domain_events` | Outbox events for RabbitMQ (`published_at IS NULL` = not sent yet) |

All statuses are in `src/common/statuses.ts`.
