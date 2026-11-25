# Compliance Service database migrations

- **Database:** `compliance_db` only (`apps/compliance-service/.env`, `DB_NAME=compliance_db`).
- **Runtime:** `synchronize: false` in `app.module.ts` — never auto-DDL in production.
- **CLI data source:** `data-source.ts` (entities + migrations glob).
- **Migration history table:** `compliance_migrations` (created automatically on first `migration:run`).

## Commands (from `backend/`)

Run only after explicit approval and against the intended `compliance_db` target:

```bash
npm run migration:compliance:show
npm run migration:compliance:run
npm run migration:compliance:revert
```

Generate new migrations (when entities change):

```bash
npm run migration:compliance:generate
```

## Initial schema

- **Migration:** `migrations/1732365300000-InitialComplianceSchema.ts`
- **Idempotency:** TypeORM records executed migrations in `compliance_migrations`; re-running `migration:run` skips applied migrations.
- **Manual SQL reference:** `migrations/initial-compliance-schema.sql` mirrors the `up()` DDL for DBA review (not executed by the app).