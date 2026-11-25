# compliance-service

DealPulse Compliance microservice (NestJS) — matrices, requirements, evidence, reviews, and sign-offs.

## Local setup

1. Copy `apps/compliance-service/.env.example` to **`apps/compliance-service/.env`** and set Aiven credentials for **`compliance_db`** (`DB_HOST`, `DB_PORT`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=compliance_db`, `DB_SSL_CA`). Resolution is cwd-independent (`backend/apps/compliance-service/.env` only; no fallback to root or document `.env`).
2. Deploy schema: see `src/database/README.md` — after approval, `npm run migration:compliance:run` from `backend/` (targets `compliance_db` only).
3. Migrations CLI uses `apps/compliance-service/src/database/data-source.ts`; `synchronize` remains **false**.
4. Start: `npm run start:compliance` (from `backend/`)
5. Swagger: http://localhost:3008/api/docs

## Auth integration

`libs/security` is not wired yet. Future business endpoints may read actor id via header `x-changed-by`. Bearer auth in Swagger is prepared for future JWT integration; no auth guards are enabled in this service yet.

## Health

`GET /api/v1/health`