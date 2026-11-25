# DealPlus Backend (NestJS monorepo)

## RFP + Document Service (Phase 2.3)

### Ports and databases

| Application       | Port | Database              | Notes                                      |
|-------------------|-----:|-----------------------|--------------------------------------------|
| Document Service  | 3005 | `document_db` | MinIO + ClamAV required for uploads        |
| RFP Service       | 3004 | `rfp_db`             | Calls Document Service over HTTP           |
| API Gateway       | 3000 | —                    | Scaffold                                   |
| Auth Service      | 3001 | —                    | Auth module — future team                  |
| Lead Service      | 3002 | —                    |                                            |
| Opportunity Service | 3005 | —                  | Conflicts with Document Service if both run locally — use one at a time |

Use **separate `DB_NAME` values**. Never run Document Service migrations against `rfp_db`.

### Local infrastructure (MinIO + ClamAV)

```bash
cd backend
npm run infra:up
npm run infra:wait   # ClamAV may take 2–3 minutes on first start
```

Compose file: `docker-compose.local.yml`  
Provides **LocalStack S3** on port `9000` (`test` / `test`) and **ClamAV** on `3310`.  
If you run real MinIO instead, use `dealplus_admin` / `LocalMinio@2026` (`StorageService` defaults) and `scripts/start-minio-host.sh` as a fallback when Docker Hub images are blocked.

```bash
npm run db:ensure   # after sourcing .env.documents.local — creates DB if missing
```

### Environment files

| File                         | Purpose                                      |
|------------------------------|----------------------------------------------|
| `.env`                       | Your private credentials (gitignored)        |
| `.env.example`               | Combined template                            |
| `.env.rfp.local.example`     | RFP Service template (`DB_NAME=rfp_db`)      |
| `.env.documents.local.example` | Document Service template                |

**Recommended:** copy the two `*.local.example` files to `.env.rfp.local` and `.env.documents.local`, paste shared MySQL host/user/password, keep distinct `DB_NAME` values. Do not overwrite `.env` if it already has remote credentials.

Document Service when running in Docker Compose networks should use `MINIO_ENDPOINT=minio` and `CLAMAV_HOST=clamav`. On the host: `localhost` / `127.0.0.1`.

RFP → Document (host): `DOCUMENT_SERVICE_BASE_URL=http://localhost:3005`  
RFP → Document (compose network): `DOCUMENT_SERVICE_BASE_URL=http://document-service:3005`

### Migrations

```bash
# Document Service — DB_NAME must be document_db
set -a && source .env.documents.local && set +a
npm run migration:show
npm run migration:run

# RFP Service — DB_NAME must be rfp_db
set -a && source .env.rfp.local && set +a
npm run migration:show:rfp
npm run migration:run:rfp
```

### Start services (two terminals)

```bash
# Terminal 1 — Document Service
set -a && source .env.documents.local && set +a
npm run start:documents

# Terminal 2 — RFP Service
set -a && source .env.rfp.local && set +a
npm run start:rfp
```

Health:

- Document: `GET http://localhost:3005/api/v1/health`
- RFP live: `GET http://localhost:3004/api/v1/health`
- RFP ready: `GET http://localhost:3004/api/v1/health/ready` (includes `dbName`)

### End-to-end PDF workflow

With both services and infra running:

```bash
npm run e2e:pdf
```

Or enable Jest live test:

```bash
RUN_RFP_DOCUMENT_E2E=1 npm run test:rfp
```

### Regression tests

```bash
npm run test:rfp
npm run test:documents
npx nest build rfp-service
npx nest build document-service
```

### Authentication (deferred)

Neither service enforces JWT guards in application code yet. Document workflows still:

- Forward incoming `Authorization` from RFP download requests to Document Service.
- Support `DOCUMENT_SERVICE_S2S_TOKEN` when no user token is present.

Future Auth Module integration points:

- RFP: `@ApiBearerAuth()` on `RfpsController` / `RfpDocumentsController`; wire global guard when available.
- Document: Swagger `addBearerAuth()` only; attach guards on `uploads`, `documents`, `attachments` routes.
- Do not bypass association checks or cross-service header forwarding when auth lands.

**Local dev:** bind services to localhost; do not expose admin ports on public interfaces.

### NestJS monorepo

See `nest-cli.json` for all applications. Install and build:

```bash
npm install
npx nest build <project-name>
npm run start:<script>   # e.g. start:documents, start:rfp
```