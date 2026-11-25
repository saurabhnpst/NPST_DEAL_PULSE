# Project Overview

## What DealPulse is

DealPulse (DealPlus) is an enterprise sales workflow product covering **lead → opportunity → RFP → compliance → PO → post-PO** for NPST verticals (Sales, P&amp;L Head, Solution). The repository is a **monorepo**:

| Area | Path | Role |
|------|------|------|
| Frontend | `frontend/` | React 18 + Vite demo/workflow UI |
| Backend | `backend/` | NestJS monorepo (12 app entrypoints) |
| Infrastructure | `docker-compose.yml`, `backend/docker-compose.local.yml` | MySQL, Redis, RabbitMQ, MinIO/LocalStack |
| Docs | `docs/` | Architecture, env, PRDs, this pack |

## Strategic decisions (from code and docs)

1. **Authentication** is external: [Command Module (`auth_gateway`)](../command-module-integration.md)—not `apps/auth-service`.
2. **Document Service** uses MySQL database **`document_db`** (consolidated; legacy `dealplus_documents` removed per [consolidation doc](../database/document-db-consolidation.md)).
3. **One database per service** on shared MySQL (`docs/database/ownership.md`); no cross-DB FKs; cross-service IDs stored as UUIDs.
4. **Inactive services** (Delivery, Notification, Reporting, in-repo Auth) remain as folders but are out of active gateway scope.

## Repository maturity (honest snapshot)

| Layer | Maturity |
|-------|----------|
| Frontend UX | Rich **demo** with local seed data |
| Lead / Document / RFP APIs | **Implemented** with migrations and tests |
| Gateway + Command Module wiring | **Partial** (proxy + auth client; IAM not in repo) |
| Opportunity → Post-PO microservices | **Scaffold / health only** |
| End-to-end product | **Not runnable** as one connected system without substantial integration work |

## What this documentation pack is for

Provide an **accurate as-built picture** and a **practical roadmap** before the next development phase—without changing application source in the analysis pass.