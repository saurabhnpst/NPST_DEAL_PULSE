# Document database consolidation (2026-11-25)

## Outcome

| Item | Result |
|------|--------|
| Primary database | **`document_db`** |
| Removed database | **`dealplus_documents`** (dropped from Aiven MySQL after merge) |
| Backups | `backend/backups/document-db-consolidation-2026-11-25T06-23-35-858Z/` |

## Final row counts (`document_db`)

| Table | Count | Notes |
|-------|------:|-------|
| `documents` | 9 | 6 existing + 3 migrated |
| `document_versions` | 9 | 6 existing + 3 migrated |
| `document_attachments` | 4 | 1 pre-existing + 3 migrated (audit had shown 0 attachments earlier) |
| `migrations` | 2 | Unchanged |

Foreign keys: **no orphan** versions or attachments after merge.

## MinIO

All **9** `storageKey` values were **not present** on the configured endpoint (`http://localhost:9000`, bucket `dealplus-documents`, LocalStack). Metadata was merged and `dealplus_documents` dropped per approved consolidation; **blob restore** must use team backups or re-upload if downloads are required.

## Configuration updates

- `DB_NAME=document_db` in Document Service env templates and `backend/.env.documents.local`
- Removed `dealplus_documents` from `docker/mysql/init-databases.sql`
- `dealplus_documents` removed from project docs (except this archive and backup artifacts)

## Rollback (emergency)

1. Restore `dealplus_documents` from `dealplus_documents.json` in the backup folder (manual SQL or tooling).
2. Re-import any `document_db` rows from `document_db.json` snapshot taken **before** merge if needed.
3. Point `DB_NAME` back only if a restored database exists.

Do not run rollback without DBA approval.