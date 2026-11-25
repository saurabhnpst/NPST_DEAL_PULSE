# Local Application Startup Guide

Runs the whole DealPulse stack on one machine (Windows, macOS or Linux). **No Docker and no Redis needed.**

| Part | Port | Notes |
|------|------|-------|
| Frontend (Vite) | 5173 | v14 UI, all data from the API |
| API Gateway | 3010 | single entry for the browser: `/api/v1/*`, `/api/auth/*`, `/api/me`, `/api/users` |
| auth-service | 3001 | local sign-in, sessions in memory |
| lead / opportunity / rfp / document / approval / assignment / compliance | 3002–3008 | NestJS services |
| MinIO | 9000 (console 9001) | document files; downloaded once into `backend/.local/` |

Databases: one MySQL database per service (shared Aiven instance), configured in `backend/apps/<service>/.env`.

## First-time setup

```bash
npm --prefix backend install
npm --prefix frontend install
```

Env files (copy the `.env.example` next to each when missing):

- `backend/apps/<service>/.env` — `DB_*` for each service
- `backend/apps/auth-service/.env` — `AUTH_LOCAL_USERS` (see below)
- `backend/apps/document-service/.env` — `MINIO_*`, `CLAMAV_ENABLED=false` for local dev (uploads skip the virus scan; stored `scanStatus = SKIPPED`)
- `frontend/.env` — `VITE_API_BASE_URL=http://localhost:3010/api/v1`, `VITE_AUTH_BASE_URL=http://localhost:3010`

Run pending migrations (additive; safe to repeat), then seed the standard compliance lines once:

```bash
cd backend
npm run migration:lead:run
npm run opp:migrate
npm run migration:run:rfp
npm run migration:run:approval
npm run migration:run                 # document-service
npx typeorm-ts-node-commonjs -d apps/compliance-service/src/database/data-source.ts migration:run
npm run seed:compliance               # needs the backend running (uses the gateway)
```

## Start

```bash
# terminal 1 — MinIO + auth + gateway + all services (watch mode)
npm run start:backend

# terminal 2
npm run start:frontend
```

Open http://localhost:5173. Health: http://localhost:3010/health/ready · Swagger: http://localhost:3010/api/docs

Stop: `Ctrl+C` in terminal 1, or `npm run stop:backend`.

## Users (local development)

Defined in `backend/apps/auth-service/.env` → `AUTH_LOCAL_USERS` (JSON). Each user has:

| Field | Meaning |
|-------|---------|
| `roles` | `sales` · `pl_head` · `presales` (decides the screens) · `admin` (uses the vertical picked on the sign-in screen) |
| `userId` | numeric business id (owner of leads / opportunities) |
| `approvalActorId` | approval-service actor (`actor-sales-manager`, `actor-pnl-head`) — needed to submit or decide lead approvals |

Default accounts: `sales@dealpulse.demo`, `plhead@dealpulse.demo`, `solution@dealpulse.demo` (password in the `.env`).

The frontend sends the signed-in user to the services as `x-user-id` / `x-changed-by` / `x-actor-id` (development identity; production must take identity from the IAM session at the gateway).

## End-to-end workflow (what is wired)

| Step | Screen | Service(s) |
|------|--------|------------|
| Lead create / edit / status | Leads, Lead detail | lead-service |
| Submit for approval → approve / more work / reject | Lead → Approval tab | approval-service → lead-service (approve creates the opportunity via opportunity-service) |
| RFP lead → synopsis → Pre-Sales accept / return | RFP synopsis | rfp-service → opportunity-service + lead-service |
| Opportunity details, stages, hold / close / reopen, fallback, commercials, PO receipt, history | Opportunity | opportunity-service |
| Documents | Opportunity → Documents / PO | document-service + MinIO |
| Pre-PO evaluations | Pre-PO, Opportunity tab | opportunity-service (`/opportunity-evaluations`) |
| Sales recommendation → P&L Proceed / Reject | Opportunity → Proposal & decision, P&L decisions | opportunity-service (`/opportunity-decisions`) |
| Compliance matrix → SME review → sign-off | Compliance | compliance-service |
| Dashboards | Dashboard (per role) | computed from the loaded data |

Out of scope (placeholders in the UI): Post-PO, RFP auto-extraction (needs Redis workers), contact / mailbox pickers (Microsoft Graph), Teams messages (in-app simulation only).
