# Technology Stack

## Frontend (`frontend/`)

| Technology | Version (package.json) | Usage |
|------------|------------------------|--------|
| React | 18.3.x | SPA pages and components |
| Vite | 5.4.x | Dev server (port **5173**), build |
| Hash router | Custom (`router.jsx`) | No React Router dependency |

No TypeScript, no global state library (custom `Store.jsx` + Context).

## Backend (`backend/`)

| Technology | Usage |
|------------|--------|
| NestJS 10 | All microservices |
| TypeORM 0.3 | Lead, Document, RFP (MySQL) |
| BullMQ | RFP PDF + information-extraction workers |
| ioredis | RFP queues + Command Module session reads |
| AWS SDK S3 API | Document Service → MinIO/LocalStack |
| `http-proxy-middleware` | API Gateway upstream routing |
| Swagger | Lead, Document, RFP |

Shared libraries under `backend/libs/`:

| Library | Status |
|---------|--------|
| `command-module-auth` | Session guard (Redis `sess:*`) |
| `common` | Env paths, `DealplusAuthModule` |
| `security` | **Empty** (`.gitkeep` only—legacy JWT placeholder) |
| `messaging`, `contracts`, `logger` | **Empty** scaffolds |

## Data stores

| Store | Used by | Notes |
|-------|---------|--------|
| MySQL 8 | Lead, Document, RFP, (planned stubs) | SSL common on managed hosts |
| PostgreSQL | Command Module only (external) | `iam_db`—not in DealPulse repo |
| Redis | RFP BullMQ; optional session auth | Root compose + auth_gateway |
| MinIO / LocalStack | Document blobs | `MINIO_*` env |
| ClamAV | Document upload scan | Local compose |

## Infrastructure (repo)

| File | Services |
|------|----------|
| `/docker-compose.yml` | mysql, rabbitmq, redis, minio |
| `backend/docker-compose.local.yml` | localstack (S3), clamav |

**Not verified in analysis:** whether RabbitMQ is consumed by any TypeScript code (no client references found in active services).

## External systems

| System | Purpose |
|--------|---------|
| Command Module (`auth_gateway`) | Login, sessions, permissions |
| Aiven MySQL (optional) | Hosted dev DBs per `.env` templates |

## Tooling

- Jest (lead, rfp, document unit tests; rfp integration configs)
- TypeORM CLI migrations (lead, document, rfp)
- Nest CLI monorepo (`nest-cli.json`, 12 projects)