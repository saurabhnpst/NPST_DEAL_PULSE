# DealPulse System Design Documentation

Read-only architecture and gap assessment captured **2026-11-25**. Findings are derived from repository source, migrations, and configuration templates—not from live database connections in this pass.

| # | Document | Description |
|---|----------|-------------|
| 01 | [Project Overview](./01-project-overview.md) | Product scope, goals, repo layout |
| 02 | [Technology Stack](./02-technology-stack.md) | Languages, frameworks, infrastructure |
| 03 | [Frontend Architecture](./03-frontend-architecture.md) | React/Vite, routing, state, API layer |
| 04 | [Backend Microservices](./04-backend-microservices.md) | NestJS services, ports, maturity |
| 05 | [API Inventory & Mapping](./05-api-inventory-mapping.md) | Endpoints and frontend screen mapping |
| 06 | [Database Architecture](./06-database-architecture.md) | Ownership, entities, ER diagram |
| 07 | [Authentication & Authorization](./07-authentication-authorization.md) | Command Module integration |
| 08 | [Infrastructure & Deployment](./08-infrastructure-deployment.md) | Docker, messaging, storage |
| 09 | [Business Workflow](./09-business-workflow.md) | Lead-to-close flow vs implementation |
| 10 | [Implementation Gaps](./10-implementation-gaps.md) | Status matrix and priorities |
| 11 | [Testing Assessment](./11-testing-assessment.md) | Automated test coverage |
| 12 | [Target Architecture](./12-target-architecture.md) | Recommended end state |
| 13 | [Implementation Roadmap](./13-implementation-roadmap.md) | Phased delivery plan |
| 14 | [Executive Summary](./14-executive-summary.md) | Leadership one-pager |

**Related docs outside this folder**

- [Environment configuration](../environment-configuration.md)
- [Command Module integration](../command-module-integration.md)
- [Database consolidation](../database/document-db-consolidation.md)
- [API catalogue (proposed)](../api/api-catalog.md)
- [Database ownership plan](../database/ownership.md)