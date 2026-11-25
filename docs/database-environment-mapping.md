# Database Environment Mapping

**Date:** 2026-11-25 · **Method:** Read TypeORM configs, `.env.example`, migrations; no passwords recorded.

## Server databases you reported

| Name on server | Assessment |
|----------------|------------|
| `lead_db` | **Active** — Lead Service |
| `opportunity_db` | **Active** — Opportunity Service |
| `rfp_db` | **Active** — RFP Service |
| `document_db` | **Active** — Document Service (canonical) |
| `approval_db` | **Active** — Approval migrations / intended runtime DB |
| `assignment_db` | **Active** — Assignment Service |
| `compliance_db` | **Active** — Compliance Service |
| `dealplus_documents` | **Legacy** — pre-consolidation name; **do not** point Document Service here |
| `approval-service` | **Unrelated / legacy** — not referenced in Nest config (likely old catalog or typo) |
| `delivery_db`, `reporting_db` | **Legacy / out of scope** — no active Nest app in Phase 1 |
| `defaultdb` | **Infrastructure default** — not used by DealPulse services |

## Service → database matrix

| Microservice | Configured `DB_NAME` (code) | Expected on server | Status | Required action |
|--------------|----------------------------|--------------------|--------|-----------------|
| Lead Service | `lead_db` | `lead_db` | **Aligned** | Use existing DB; run `npm run migration:lead:run` if pending |
| Opportunity Service | `opportunity_db` | `opportunity_db` | **Aligned** | Use existing; `npm run opp:migrate` |
| RFP Service | `rfp_db` | `rfp_db` | **Aligned** | Use existing; `npm run migration:run:rfp` |
| Document Service | `document_db` | `document_db` | **Aligned** | **Not** `dealplus_documents` |
| Approval Service | `approval_db` | `approval_db` | **Partial** | Migrations exist; **runtime uses in-memory repo** (see verification report) |
| Assignment Service | `assignment_db` | `assignment_db` | **Aligned** | `ASSIGNMENT_DB_NAME` or `assignment_db`; `npm run asg:migrate` |
| Compliance Service | `compliance_db` | `compliance_db` | **Aligned** | Set `DB_SSL_MODE=DISABLED` locally or `VERIFY_CA` + `DB_SSL_CA` for managed MySQL |
| API Gateway | — | — | N/A | No database |

## TLS configuration (Phase 1 fix)

| Setting | Local dev | Managed MySQL (e.g. Aiven) |
|---------|-----------|---------------------------|
| `DB_SSL_MODE` | `DISABLED` | `VERIFY_CA` or `REQUIRED` |
| `DB_SSL_CA` | Omit | `./ca.pem` under `backend/` |
| `DB_SSL_REJECT_UNAUTHORIZED` | Omit | `true` when CA present |

Shared helper: `backend/libs/service-config/src/mysql-ssl.ts` (used by Compliance, Lead/RFP migrations alignment).

## Document Service database proof

| Source | Value |
|--------|--------|
| `apps/document-service/.env.example` | `DB_NAME=document_db` |
| `apps/document-service/src/app.module.ts` | `config.getOrThrow('DB_NAME')` |
| Consolidation doc | `document_db` replaces `dealplus_documents` |

**Action:** Keep Document Service on **`document_db`**. Do not drop or migrate away from `dealplus_documents` without an explicit data migration project.

## Approval `approval_db` vs in-memory

| Artifact | Uses DB? |
|----------|----------|
| `approval-service/src/database/migrations/` | Yes (schema) |
| `approval-service/src/app.module.ts` | **No** — `InMemoryApprovalRepository` |
| `assertRequiredEnv(['DB_HOST', ...])` in `main.ts` | Yes (connection vars required at boot) |

**Action:** No DB rename. Optional future work: wire TypeORM repository to `approval_db` without dropping data.