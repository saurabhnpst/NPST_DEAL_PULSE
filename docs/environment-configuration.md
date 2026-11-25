# DealPlus environment configuration

## Active vs inactive services

### Active (configured in this pass)

| Service | Port | Database | ENV template |
|---------|------|----------|----------------|
| API Gateway | 3000 | — | `backend/apps/api-gateway/.env.example` |
| Lead Service | 3002 | `lead_db` | `backend/apps/lead-service/.env.example` |
| Opportunity Service | 3003 | `opportunity_db` | `backend/apps/opportunity-service/.env.example` |
| Approval Service | 3006 | `approval_db` | `backend/apps/approval-service/.env.example` |
| Assignment Service | 3007 | `assignment_db` | `backend/apps/assignment-service/.env.example` |
| Compliance Service | 3008 | `compliance_db` | `backend/apps/compliance-service/.env.example` |
| Document Service | 3005 | `document_db` | `backend/apps/document-service/.env.example` |
| RFP Service | 3004 | `rfp_db` | `backend/apps/rfp-service/.env.example` |

**Command Module (external):** PostgreSQL `iam_db`, Redis, Keycloak — see `docs/command-module-integration.md`.

### Inactive (left in repo, not wired in compose)

- Auth Service (replaced by Command Module)
- Delivery, Notification, Reporting services

## Database ownership

| Database | Owner | Notes |
|----------|-------|-------|
| `lead_db` | Lead Service | Local Docker init creates schema |
| `opportunity_db` | Opportunity Service | Stub service; DB ready |
| `approval_db` | Approval Service | Stub |
| `assignment_db` | Assignment Service | Stub |
| `compliance_db` | Compliance Service | Stub |
| `document_db` | Document Service | Sole Document Service database (consolidated 2026-11-25) |
| `rfp_db` | RFP Service | Enforced in integration tests |
| `defaultdb` | — | Managed MySQL default (Aiven); not assigned to a service |
| `iam_db` | Command Module (Postgres) | Not on DealPlus MySQL |

## ENV file locations

| File | Scope |
|------|--------|
| `/.env` | Docker infrastructure (MySQL, RabbitMQ, Redis, MinIO) — template: `/.env.example` |
| `backend/apps/<service>/.env` | Per microservice (copy from `.env.example`) |
| `frontend/.env` | `VITE_*` only — template: `frontend/.env.example` |
| `auth_gateway/.env` | Command Module (separate repo; do not merge) |

Legacy combined file `backend/.env` may still be used for one-off CLI migrations; prefer per-service files for runtime.

## Shared infrastructure (root Docker Compose)

```bash
cp .env.example .env
docker compose up -d
```

Services: `mysql`, `rabbitmq`, `redis`, `minio` (see `docker-compose.yml`).

Document scanning stack (LocalStack + ClamAV) remains in `backend/docker-compose.local.yml` (`npm run infra:up`).

## Local startup (without Docker apps)

1. Start infrastructure: `docker compose up -d` (repo root).
2. Start Command Module iam-api (see command-module doc).
3. Copy ENV templates:
   ```bash
   for s in api-gateway lead-service document-service rfp-service; do
     cp backend/apps/$s/.env.example backend/apps/$s/.env
   done
   cp frontend/.env.example frontend/.env
   ```
4. Adjust `DB_*` in service `.env` files (local MySQL or managed host).
5. From `backend/`:
   ```bash
   npm run start:gateway
   npm run start:leads
   npm run start:documents
   npm run start:rfp
   ```
6. Frontend: `cd frontend && npm run dev`

## Authentication environment variables

| Variable | Where | Purpose |
|----------|-------|---------|
| `IAM_API_URL` | api-gateway | Upstream iam-api for `/api/auth`, `/api/me` |
| `REDIS_SERVICE_URL` | each active service | Read Command Module sessions (`sess:` keys) |
| `SESSION_COOKIE_NAME` | each active service | Default `session_id` |
| `VITE_AUTH_BASE_URL` | frontend | Gateway origin for auth (default `http://localhost:3000`) |
| `VITE_API_BASE_URL` | frontend | `http://localhost:3000/api/v1` |

## API Gateway routing

| Incoming prefix | Upstream |
|-----------------|----------|
| `/api/auth`, `/api/me`, `/api/public` | `IAM_API_URL` |
| `/api/v1/leads` | Lead Service |
| `/api/v1/documents`, `/uploads`, `/entity-documents` | Document Service |
| `/api/v1/rfps` | RFP Service |
| `/api/v1/opportunities` | Opportunity Service |
| `/api/v1/approvals`, `/decisions` | Approval Service |
| `/api/v1/assignments` | Assignment Service |
| `/api/v1/compliance` | Compliance Service |

CORS: `CORS_ORIGINS` on api-gateway (comma-separated).

## Security

- Never commit `backend/apps/*/.env`, root `.env`, or `frontend/.env`.
- Do not put secrets in `VITE_*` variables.
- JWT variables in old `backend/.env.example` are **not used** by DealPlus services.

## Validation at startup

Each service calls `assertRequiredEnv` in `main.ts` for its required keys (e.g. `DB_*`, gateway `IAM_API_URL`).

Database connectivity is **not** claimed at boot except RFP `/health/ready` when the service is running.