# opportunity-service

NestJS service for DealPlus opportunities: the record, stages, products, revenue, commercials, PO receipt and history.

- **API contract** (for the gateway, frontend and other services): [API.md](./API.md)
- **Architecture** (+ plain-language project overview): [docs/ARCHITECTURE.md](./docs/ARCHITECTURE.md)
- **How to run:** [docs/RUNNING.md](./docs/RUNNING.md) · **For teammates:** [docs/TEAM-GUIDE.md](./docs/TEAM-GUIDE.md)
- **Port:** 3005 (`OPPORTUNITY_SERVICE_PORT`). Prefix `/api/v1`. Health: `GET /api/v1/health`.
- **Database:** MySQL `opportunity_db`, owned only by this service.

## Run (from `backend/`)

```bash
npm run opp:migrate          # create / update tables
npm run start:opportunities  # start with watch
npm run test:opportunities   # unit + HTTP tests (no database needed)
```

Test config: `jest.config.js` + `jest.setup.js` in this folder. The repo-wide `npm test` runs another service's tests.
If `nest` / `jest` aren't found, run `npm install` in `backend/` on your own machine.

## Configuration

`.env` is read from `backend/.env` or the repo root. `OPPORTUNITY_DB_*` overrides the shared `DB_*`.

| Variable | Purpose |
|---|---|
| `DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD` | MySQL connection |
| `DB_NAME` / `OPPORTUNITY_DB_NAME` | Database (default `opportunity_db`) |
| `DB_SSL_MODE` | `REQUIRED` for Aiven (TLS) |
| `DB_SSL_CA`, `DB_SSL_REJECT_UNAUTHORIZED` | Path to the Aiven `ca.pem` and `true` for full certificate checks |
| `OPPORTUNITY_DB_MIGRATE` | `true` = run pending migrations on startup |
| `AUTH_SERVICE_URL`, `DOCUMENT_SERVICE_URL` | Optional: verify user / document ids with those services |
| `OPPORTUNITY_STRICT_EXT_REFS` | `true` = reject the request when that check fails (default: warning only) |

## Database

| Table | Holds |
|---|---|
| `opportunities` | The record: every Details-tab field, plus JSON for tasks, deal team, hold fallbacks and commercial lines |
| `opportunity_products` | Product slots 1–4 with their modules |
| `opportunity_stage_history` | One row per stage move, with its reason, PO, hold and override details |
| `opportunity_commercial_history` | Saved commercial versions (snapshots) |
| `opportunity_activities` | Calls, meetings, emails and notes from the History tab |
| `opportunity_public_id_sequences` | Per-year counter for `OPP-YYYY-NNNNN` |
| `opportunity_domain_events` | Outbox: events waiting to be published (see API.md) |

`database/schema.sql` and the migration `src/migrations/1732200000000-OpportunitySchema.ts` contain the same SQL.
`src/database/schema.spec.ts` fails if they differ, so change both together.

- **Before go-live** (no real data): edit both files, then rebuild your dev tables with
  `npm run opp:migrate:revert && npm run opp:migrate`.
- **After go-live:** never edit an applied migration. Add a new migration (e.g. `ALTER TABLE …`), update
  `schema.sql` to the final shape, and change `schema.spec.ts` to compare `schema.sql` with a fresh database
  instead of the first migration.

## Code map (`src/`)

| Folder / file | What it does |
|---|---|
| `opportunities/opportunity-fields.ts` | **The list of editable fields.** Add a column here + entity + DTO + schema |
| `opportunities/` | CRUD, list filters, response mapper, public id |
| `stages/` | Stage rules (ported from the frontend) and stage actions |
| `commercials/`, `po/`, `activities/`, `history/`, `fallback/` | One feature each |
| `revenue/`, `contributors/`, `products/` | Views of the record; writes go through `OpportunitiesService.update` |
| `common/` | Validation helpers, `x-user-id` header, error format, calculations |
| `events/` | Writes outbox events in the same transaction as the change |

### Adding a field
1. Add the column to `database/schema.sql` and the migration (see the go-live rules above).
2. Add the property to `entities/opportunity.entity.ts`.
3. Add the name to `EDITABLE_FIELDS` (and to `AMOUNT_FIELDS` / `DATE_FIELDS` if it's a number or date).
4. Add one validation line to `opportunities/dto/opportunity-fields.dto.ts`.

The response picks it up automatically.
