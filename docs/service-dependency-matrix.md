# Service Dependency Matrix

| Source | Target | Mechanism | Status | Required env |
|--------|--------|-----------|--------|--------------|
| RFP | Document | HTTP client (`document-service.client.ts`) | **IMPLEMENTED** | `DOCUMENT_SERVICE_BASE_URL` |
| Lead | Approval | `ApprovalIntegration` | **STUB** (log only) | — |
| Lead | Opportunity | `OpportunityIntegration` | **STUB** (log only) | — |
| Assignment | Opportunity | `OpportunityClient` | **MOCK/REAL** | `OPPORTUNITY_SERVICE_URL` |
| Assignment | RFP | `RfpClient` | **MOCK/REAL** | `RFP_SERVICE_URL` |
| Assignment | Notification | `NotificationClient` | **MOCK/REAL** | notification URL |
| Assignment | Users/Auth | `UsersClient` | **MOCK/REAL** | `AUTH_SERVICE_URL` |
| Approval | Document | `document-client.ts` | **MOCK** (deferred) | — |
| Approval | Notification | `notification-client.ts` | **MOCK** | — |
| Frontend | API Gateway | HTTP | **READY** (Phase 2) | `VITE_API_BASE_URL` |
| API Gateway | 7 services | Reverse proxy | **IMPLEMENTED** | `*_SERVICE_URL` |
| Any (optional) | Command Module | Session Redis | **PARTIAL** | `REDIS_SERVICE_URL` |
| RFP | Redis | BullMQ | **IMPLEMENTED** | `REDIS_HOST` / URL |
| Document | MinIO | S3 API | **IMPLEMENTED** | `MINIO_*` |
| Document | ClamAV | TCP scan | **IMPLEMENTED** | `CLAMAV_*` |
| All | RabbitMQ | — | **MISSING** | Not used in app code |

**Failure handling:** Gateway returns **502 JSON** on upstream errors; Assignment clients fall back to **mock** when URLs unset.