# Backend + Gateway Integration Readiness (Phase 1)

## Ready for Phase 2 frontend

| Item | Status |
|------|--------|
| Single API base `http://localhost:3000` | **PARTIAL** — free port 3000 |
| `/api/v1/*` proxy to 7 services | **IMPLEMENTED** |
| Compliance paths (`/frameworks`, etc.) | **IMPLEMENTED** |
| CORS for `localhost:5173` | **IMPLEMENTED** |
| Correlation IDs + request logs | **IMPLEMENTED** |
| Standard 502 when upstream down | **IMPLEMENTED** |
| Document multipart forward | **IMPLEMENTED** (`fixRequestBody`) |
| Production auth at gateway | **NOT IN SCOPE** (Command Module later) |

## Phase 2 updates (2026-11-25)

- Lead → Opportunity HTTP integration in lead-service (see `docs/phase2-backend-remediation-report.md`).
- Frontend: centralized API client, lead/opportunity/RFP/approval loading, lead approve/submit wired.
- Gateway runtime fixes (Express import, HPM pathname routing). Verified on **port 3010** while **3000** is foreign.

## Blockers before demo

1. **Free port 3000** or set `VITE_API_BASE_URL` to gateway’s actual port (e.g. `http://localhost:3010/api/v1`).
2. **Opportunity Service** list/create returning **500** on this environment (blocks convert E2E).
3. **`apps/<service>/.env`** for all seven services (same host, distinct `DB_NAME`).
4. **Redis** for RFP workers (optional for list CRUD).
5. **MinIO + ClamAV** for document upload demo.
6. **Approval** mock token (`VITE_APPROVAL_MOCK_TOKEN` / `x-mock-token`).

## Code changes delivered (Phase 1)

- Compliance `DB_SSL_MODE` support (no forced local CA).
- Lead/RFP migration data sources aligned with per-service `.env` + optional TLS.
- Opportunity default port **3003**.
- API Gateway hybrid Express bootstrap + full route table + readiness probes.
- `backend/.env.example` port/URL reference.