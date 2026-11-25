# Local Application Startup Guide (Phase 3)

**Verified gateway port on this machine:** `3010` (port `3000` is often occupied by another app).

## Prerequisites

- **Node.js** ≥ 20
- **npm** at repo root and in `backend/`
- **MySQL** — existing Aiven/local databases (**no drops/resets**):
  - `lead_db`, `opportunity_db`, `rfp_db`, `document_db`, `approval_db`, `assignment_db`, `compliance_db`
- Per-service env: copy `backend/apps/<service>/.env.example` → `.env` if missing; set shared `DB_*` and correct `DB_NAME`
- **Frontend:** copy `frontend/.env.example` → `frontend/.env`

### Optional infrastructure (document upload / RFP workers)

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE/backend
npm run infra:up          # LocalStack S3 + ClamAV (docker)
npm run infra:wait        # Wait for ports 9000 + 3310
```

**Redis** (RFP Bull jobs): use your existing Redis host in `apps/rfp-service/.env` — not started by `infra:up`.

## Check ports (does not kill anything)

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE
npm run ports:check
```

## One command — all backend + gateway

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE
npm run start:backend
```

Equivalent:

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE/backend
npm run start:all
```

Labeled logs: `auth`, `gateway`, `leads`, `opps`, `rfp`, `docs`, `approval`, `assign`, `compliance`.

**Login:** `start:all` includes **auth-service** on port **3001**. Set `IAM_API_URL=http://localhost:3001` in `apps/api-gateway/.env` and configure `AUTH_LOCAL_USERS` in `apps/auth-service/.env` (see `apps/auth-service/README.md`). Requires **Redis** for sessions (`redis://127.0.0.1:6379`).

## Stop backend

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE
npm run stop:backend
```

If you started services in separate terminals, use **Ctrl+C** in each (stop-all only tracks `start:all`).

## Frontend

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE
npm run start:frontend
```

## Full stack (two terminals — recommended)

**Terminal 1**

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE
npm run infra:up          # optional
npm run start:backend
```

**Terminal 2**

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE
npm run start:frontend
```

## URLs (with `PORT=3010` in `apps/api-gateway/.env`)

| What | URL |
|------|-----|
| Frontend (Vite) | http://localhost:5173 |
| API Gateway | http://localhost:3010 |
| Business API base | http://localhost:3010/api/v1 |
| Central Swagger UI | http://localhost:3010/api/docs |
| Gateway liveness | http://localhost:3010/health |
| Gateway readiness | http://localhost:3010/health/ready |
| Per-service Swagger (debug) | http://localhost:3002/api/docs … `3008/api/docs` |

## Automated smoke (after backend is up)

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE
npm run smoke
```

With approval token:

```bash
APPROVAL_MOCK_TOKEN='<token>' GATEWAY=http://localhost:3010 npm run smoke
```

## Migrations (safe, non-destructive — run when schema drifts)

From `backend/`:

```bash
npm run migration:lead:run
npm run opp:migrate
npm run migration:run:rfp
npm run migration:run:approval
npm run asg:migrate
npm run migration:run          # document-service
```

Compliance: see `backend/apps/compliance-service/src/database/README.md`.