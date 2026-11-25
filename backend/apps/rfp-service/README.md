# rfp-service — Phase 1 + Phase 2 (documents)

NestJS microservice for RFP **record management** in DealPulse (`rfp_db`). Phase 1 covers persistence, health probes, and CRUD APIs. **Phase 2** adds Document Service HTTP integration, RFP/lead document associations, and PDF download. **Phase 3** adds asynchronous PDF text extraction (PDF.js), scanned-page OCR (Poppler + Tesseract), and page-wise storage in `rfp_db` via BullMQ/Redis. **Phase 4** adds rule-based information extraction from processed text, configurable field mapping, authorized review/confirmation, amendment versions, and comparison — without LLM integration.


## Runtime

- Entry: `src/main.ts`
- Global prefix: `/api/v1`
- Default port: `3004` (`npm run start:rfp` from `backend/`)
- **Swagger UI:** [http://localhost:3004/api/docs](http://localhost:3004/api/docs) (not under `/api/v1`; **Health**, **RFPs**, **RFP PDF processing**, and **RFP information extraction** tags)
- OpenAPI JSON: `http://localhost:3004/api/docs-json`

Database connection reuses shared `DB_*` variables; only `DB_NAME` must be `rfp_db` for this service. TypeORM `synchronize` is `false`; schema is applied via migrations (`rfp_migrations` table).

## Health

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/api/v1/health` | Liveness (process up) |
| GET | `/api/v1/health/ready` | Readiness (MySQL reachable on configured database) |

## RFP APIs (Phase 1)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/rfps` | Create RFP |
| GET | `/api/v1/rfps` | List with pagination and filters |
| GET | `/api/v1/rfps/:rfpId` | Get by id |
| PATCH | `/api/v1/rfps/:rfpId` | Partial update |
| DELETE | `/api/v1/rfps/:rfpId` | Soft delete |
| GET | `/api/v1/rfps/lead/:leadId` | List by lead (UUID) |
| GET | `/api/v1/rfps/opportunity/:opportunityId` | List by opportunity (UUID) |
| GET | `/api/v1/rfps/:rfpId/documents/:documentId/download` | Download linked PDF (binary) |

## PDF processing APIs (Phase 3)

Requires **Redis** (root `docker compose` service) and host **Poppler** + **Tesseract** binaries.

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/rfps/:rfpId/documents/:documentId/processing` | Queue PDF text extraction (202) |
| GET | `/api/v1/rfps/:rfpId/documents/:documentId/processing` | Latest job status |
| GET | `/api/v1/rfps/:rfpId/documents/:documentId/extracted-text` | Page-wise or concatenated text |
| POST | `/api/v1/rfps/:rfpId/documents/:documentId/processing/reprocess` | New processing attempt |

Migrations: `1763990000000-RfpPdfProcessingSchema.ts`, `1763990000001-RfpPdfJobProgressColumns.ts`.

### Information extraction APIs (Phase 4)

Requires completed **PDF processing** for the version’s `documentId` (page text in `rfp_pdf_page_texts`). Uses a second BullMQ queue (`rfp-information-extraction`).

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/v1/rfps/:rfpId/versions` | Register initial RFP or amendment version |
| GET | `/api/v1/rfps/:rfpId/versions` | List versions |
| POST | `/api/v1/rfps/:rfpId/versions/:versionId/extraction` | Queue field extraction (202) |
| GET | `/api/v1/rfps/:rfpId/versions/:versionId/extraction` | Extraction job status |
| GET | `/api/v1/rfps/:rfpId/versions/:versionId/fields` | Extracted fields + evidence |
| GET | `/api/v1/rfps/:rfpId/field-mappings` | Mapping configuration |
| PATCH | `/api/v1/rfps/:rfpId/versions/:versionId/fields/:fieldId/review` | Review field (`X-Reviewer-Id` header) |
| POST | `/api/v1/rfps/:rfpId/versions/:versionId/confirm` | Bulk-confirm accepted fields |
| GET | `/api/v1/rfps/:rfpId/confirmed-fields` | Confirmed values for other modules |
| GET | `/api/v1/rfps/:rfpId/versions/compare?fromVersionId=&toVersionId=` | Amendment comparison |
| PATCH | `/api/v1/rfps/:rfpId/amendments/compare/:comparisonId/diffs/:diffId/review` | Review a diff |
| GET | `/api/v1/rfps/:rfpId/audit` | Review audit trail |

Migration: `1764200000000-RfpInformationExtractionSchema.ts` (seeds `rfp_field_mapping_config`).

**Permission note:** Review endpoints require `X-Reviewer-Id` (or `X-User-Id`) until Auth Service guards enforce `rfp:review`.

Workers run in the same Nest process as the API (`PdfProcessingProcessor` and `InformationExtractionProcessor` via BullMQ). Start Redis, apply migrations, then `npm run start:rfp` from `backend/`.

### Phase 4 architecture

| Area | Location |
|------|----------|
| APIs | `src/information-extraction/rfp-information-extraction.controller.ts` |
| Extraction queue | `src/information-extraction/rfp-extraction-orchestration.service.ts` |
| Rule extraction | `src/information-extraction/rfp-extraction-execution.service.ts` |
| Field mapping | `src/field-mapping/*` |
| Review / confirm | `src/information-extraction/rfp-review.service.ts` |
| Versions / amendments | `src/information-extraction/rfp-version.service.ts`, `amendment-comparison.service.ts` |
| Worker | `src/workers/information-extraction.processor.ts` |
| Config | `src/config/information-extraction.config.ts` |

### Information extraction environment

| Variable | Description | Default |
|----------|-------------|---------|
| `RFP_EXTRACTION_QUEUE_NAME` | BullMQ queue name | `rfp-information-extraction` |
| `RFP_EXTRACTION_WORKER_CONCURRENCY` | Worker concurrency | `1` |
| `RFP_EXTRACTION_MIN_CONFIDENCE` | Confidence threshold (rule scorer) | `0.55` |
| `RFP_EXTRACTION_QUEUE_RETRY_ATTEMPTS` | BullMQ attempts | `3` |
| `RFP_EXTRACTION_QUEUE_RETRY_BACKOFF_MS` | Initial backoff (ms) | `5000` |

### Phase 3 architecture

| Area | Location |
|------|----------|
| APIs | `src/pdf-processing/rfp-pdf-processing.controller.ts` |
| Orchestration | `src/pdf-processing/pdf-processing.service.ts` |
| Page loop | `src/pdf-processing/pdf-processing-execution.service.ts` |
| BullMQ worker | `src/workers/pdf-processing.processor.ts` |
| PDF.js / Poppler / Tesseract | `src/pdf-adapters/*` |
| Config | `src/config/pdf-processing.config.ts`, `src/config/redis.config.ts` |

### Processing workflow

1. Client calls `POST .../processing` (202). Service validates RFP ↔ document association, creates a MySQL job row (`pending`), enqueues identifiers only in BullMQ.
2. Worker marks the job `processing`, downloads the PDF via `DocumentServiceClient` (caller `Authorization` or `DOCUMENT_SERVICE_S2S_TOKEN`).
3. `PdfValidationService` enforces size, page count, encryption, and PDF.js load checks.
4. For each page: PDF.js embedded text; if below `PDF_PROCESSING_MIN_TEXT_CHARS`, render that page with `pdftoppm` and OCR with Tesseract.
5. Page text upserted into `rfp_pdf_page_texts` (idempotent per `job_id` + `page_number`). Job progress columns updated after each page.
6. Job status becomes `completed`, `partial`, or `failed`. Reprocess creates a new `attempt` without deleting prior jobs.

### System dependencies (host binaries)

- **Poppler:** `pdfinfo`, `pdftoppm` on `PATH` (or `POPPLER_BINARY_PATH`)
- **Tesseract:** `tesseract` on `PATH` (or `TESSERACT_BINARY_PATH`), language packs for `TESSERACT_LANG` (default `eng`)
- **Redis:** BullMQ queue (same Redis as root `docker-compose` / `docker-compose.local.yml`)
- **MySQL:** `rfp_db` with migrations applied

### PDF processing environment

| Variable | Description | Default |
|----------|-------------|---------|
| `PDF_PROCESSING_MAX_FILE_SIZE` | Max PDF bytes | `52428800` |
| `PDF_PROCESSING_MAX_PAGES` | Max page count | `500` |
| `PDF_PROCESSING_MIN_TEXT_CHARS` | Embedded text usability threshold | `32` |
| `PDF_PROCESSING_OCR_DPI` | `pdftoppm` resolution | `200` |
| `PDF_PROCESSING_QUEUE_NAME` | BullMQ queue name | `rfp-pdf-processing` |
| `PDF_PROCESSING_WORKER_CONCURRENCY` | Worker concurrency | `1` |
| `PDF_PROCESSING_JOB_TIMEOUT` | Reserved processing budget (ms) | `1800000` |
| `PDF_PROCESSING_QUEUE_RETRY_ATTEMPTS` | BullMQ attempts | `3` |
| `PDF_PROCESSING_QUEUE_RETRY_BACKOFF_MS` | Initial backoff (ms) | `5000` |
| `PDF_POPPLER_TIMEOUT_MS` | Poppler subprocess timeout | `120000` |
| `PDF_TESSERACT_TIMEOUT_MS` | Tesseract subprocess timeout | `180000` |
| `TESSERACT_LANG` | OCR language | `eng` |
| `POPPLER_BINARY_PATH` | Optional Poppler directory or binary prefix | unset |
| `TESSERACT_BINARY_PATH` | Tesseract binary | `tesseract` |
| `REDIS_HOST` / `REDIS_PORT` | BullMQ connection | `localhost` / `6379` |

### List query parameters

- `page` (default 1), `limit` (default 20, max 100)
- `status`, `leadId`, `opportunityId`, `ownerId`, `portal`
- `search` — partial match on `title` and `referenceNumber`
- `submissionDeadlineFrom`, `submissionDeadlineTo` — ISO date strings

### List response

```json
{
  "data": [ /* Rfp entities */ ],
  "meta": { "page": 1, "limit": 20, "total": 0, "totalPages": 0 }
}
```

## `rfps` table schema (Phase 1)

Cross-service IDs (`lead_id`, `opportunity_id`, `document_id`) are stored as UUIDs **without** foreign keys (per microservice ownership).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `title` | varchar(255) | Required |
| `reference_number` | varchar(255) | Optional tender ref |
| `status` | varchar(50) | Default `Draft`; see statuses below |
| `lead_id` | char(36) | Indexed |
| `opportunity_id` | char(36) | Indexed |
| `document_id` | char(36) | Reserved for Document Service |
| `issuer_name` | varchar(255) | Customer / bank |
| `portal` | varchar(100) | e.g. GeM |
| `products` | varchar(500) | |
| `pre_bid_meeting_at` | datetime | |
| `submission_deadline` | datetime | Indexed |
| `bid_opening_at` | datetime | |
| `emd_required` | tinyint | Default 0 |
| `emd_details` | varchar(500) | |
| `pbg_required` | tinyint | Default 0 |
| `pbg_details` | varchar(255) | |
| `eligibility_notes` | text | |
| `scope_notes` | text | |
| `owner_id` | varchar(100) | |
| `created_by_id` | varchar(100) | |
| `last_modified_by_id` | varchar(100) | |
| `notes` | text | |
| `created_at` / `updated_at` | datetime(6) | |
| `deleted_at` | datetime(6) | Soft delete |

**Statuses:** `Draft`, `Registered`, `In Review`, `Submitted`, `Closed`, `Withdrawn`.

**Indexes:** `lead_id`, `opportunity_id`, `(status, created_at)`, `submission_deadline`.

## `rfp_document_associations` (Phase 2)

Tracks document ↔ RFP ↔ lead relationships in `rfp_db` (no cross-DB FKs).

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid | Primary key |
| `document_id` | char(36) | Document Service id |
| `rfp_id` | char(36) | Indexed; unique with `document_id` |
| `lead_id` | char(36) | Indexed |
| `document_name` | varchar(255) | From Document Service metadata |
| `document_type` | varchar(100) | |
| `uploaded_at` | datetime | |
| `created_at` / `updated_at` | datetime(6) | |

Rows are created or updated when an RFP is saved with `documentId` (best-effort; failures do not block CRUD). Download requires the document to match `rfps.document_id` or an association row.

## Document Service integration

RFP Service calls the Document Service using native `fetch` (`DocumentServiceClient`), aligned with `apps/document-service/docs/INTEGRATION_GUIDE.md`:

| RFP client method | HTTP | Document Service path |
|-----------------|------|------------------------|
| `getDocumentMetadata` | GET | `/api/v1/documents/:id` |
| `downloadDocument` | GET | `/api/v1/documents/:id/download` |
| `createDocumentLink` | POST | `/api/v1/documents/:id/attachments` (body: `LEAD` entity + `relationshipType: RFP`) |

Upload flows use Document Service `POST /api/v1/uploads` directly from clients; RFP Service does not store PDF bytes.

**Live E2E** (both services + MinIO + ClamAV + Document Service on `document_db`): set `RUN_RFP_DOCUMENT_E2E=1` and run `jest --config jest.rfp.integration.config.js --runInBand`.

| Consumed endpoint | Purpose |
|-------------------|---------|
| `GET /api/v1/documents/:id` | Metadata for associations |
| `GET /api/v1/documents/:id/download` | PDF bytes |
| `POST /api/v1/documents/:id/links` | Lead link sync (`entityType: lead`) |

### Configuration (environment)

| Variable | Description | Default |
|----------|-------------|---------|
| `DOCUMENT_SERVICE_BASE_URL` | Document Service origin (no trailing path) | `http://localhost:3005` |
| `DOCUMENT_SERVICE_CONNECT_TIMEOUT` | Connect budget (ms) | `5000` |
| `DOCUMENT_SERVICE_READ_TIMEOUT` | Read budget (ms) | `30000` |
| `DOCUMENT_SERVICE_S2S_TOKEN` | Bearer token for service-to-service calls | unset |

Incoming `Authorization` on download is forwarded to Document Service when present; otherwise `DOCUMENT_SERVICE_S2S_TOKEN` is used.

## Migrations

From `backend/` (with `.env` pointing at `rfp_db`):

```bash
npm run migration:run:rfp
```

Migrations:

- `1763634600000-InitialRfpSchema.ts` — `rfps`
- `1763634700000-RfpDocumentAssociations.ts` — `rfp_document_associations`
- `1763990000000-RfpPdfProcessingSchema.ts` — PDF processing jobs and page text
- `1763990000001-RfpPdfJobProgressColumns.ts` — `processed_page_count`, `failed_page_count`
- `1764200000000-RfpInformationExtractionSchema.ts` — versions, extraction jobs, fields, audit, amendments

## Redis / BullMQ (local)

From `backend/`:

```bash
npm run infra:up          # MySQL/Redis/LocalStack as defined in docker-compose.local.yml
npm run migration:run:rfp
npm run start:rfp         # API + PDF worker in one process
```

Queue name defaults to `rfp-pdf-processing`. Payload contains `processingJobId`, `rfpId`, `documentId`, and optional `userAuthorization` only (never PDF bytes).

## Tests

```bash
npm run test:rfp
```

Unit tests mock TypeORM and subprocesses where needed. Integration tests require live `rfp_db` with migrations applied (`migration:run:rfp`). PDF.js extraction tests use `backend/scripts/fixtures/sample-rfp.pdf`. Poppler/Tesseract are not invoked in unit tests.

**Live PDF E2E** (Document Service + RFP Service + upload + processing):

```bash
npm run infra:up
# start document-service and rfp-service in separate terminals
npm run e2e:pdf
```

Set `RUN_RFP_DOCUMENT_E2E=1` for document workflow integration tests against a running Document Service.