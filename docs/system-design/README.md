# DealPulse System Design Documentation

**Phase 1: Architecture discovery** — read-only analysis captured **2026-11-25** on branch **`integration`** (aligned with `main` after RFP + team service merges).

Findings are based on **repository source**, migrations, and configuration templates. Runtime behavior, live databases, and deployed environments are **NOT VERIFIED** in this pass unless explicitly stated.

## Document index

| # | Document | Description |
|---|----------|-------------|
| 01 | [Project Overview](./01-project-overview.md) | Scope, maturity, high-level architecture diagram |
| 02 | [Technology Stack](./02-technology-stack.md) | Languages, frameworks, infrastructure |
| 03 | [Frontend Architecture](./03-frontend-architecture.md) | React/Vite, routing, state, API layer |
| 04 | [Backend Microservices](./04-backend-microservices.md) | NestJS services, ports, status per service |
| 05 | [API Inventory & Mapping](./05-api-inventory-mapping.md) | Endpoints, gateway table, frontend wiring |
| 06 | [Database Architecture](./06-database-architecture.md) | DB ownership, ER diagram, migrations |
| 07 | [Authentication & Authorization](./07-authentication-authorization.md) | Command Module, guards, auth flow diagram |
| 08 | [Infrastructure & Deployment](./08-infrastructure-deployment.md) | Docker, ports, infra diagram |
| 09 | [Business Workflow](./09-business-workflow.md) | Lead-to-close vs implementation |
| 10 | [Implementation Gaps](./10-implementation-gaps.md) | Status matrix and P0–P2 gaps |
| 11 | [Testing Assessment](./11-testing-assessment.md) | Automated test coverage |
| 12 | [Target Architecture](./12-target-architecture.md) | Recommended end state |
| 13 | [Implementation Roadmap](./13-implementation-roadmap.md) | Phases 1–6 delivery plan |
| 14 | [Executive Summary](./14-executive-summary.md) | Leadership Q&A and blockers |

## Mermaid diagrams (by topic)

| Topic | Primary doc |
|-------|-------------|
| High-level system | [01](./01-project-overview.md) |
| Frontend structure | [03](./03-frontend-architecture.md) |
| Backend microservices | [04](./04-backend-microservices.md) |
| API communication | [05](./05-api-inventory-mapping.md) |
| Database ER (logical) | [06](./06-database-architecture.md) |
| Authentication flow | [07](./07-authentication-authorization.md) |
| Infrastructure | [08](./08-infrastructure-deployment.md) |
| Business workflow | [09](./09-business-workflow.md) |

## Related docs (outside this folder)

- [Environment configuration](../environment-configuration.md)
- [Command Module integration](../command-module-integration.md)
- [Database consolidation](../database/document-db-consolidation.md)
- [API catalogue (proposed)](../api/api-catalog.md)

## Delivery phases (your plan)

1. **Discovery** — this folder (current).
2. Run & verify backend.
3. Run & verify frontend.
4. Integrate through API Gateway.
5. End-to-end workflow testing.
6. Production readiness.

Do **not** treat this pack as proof that the product runs E2E today; see [14-executive-summary.md](./14-executive-summary.md).