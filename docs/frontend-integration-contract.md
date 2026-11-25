# Frontend Integration Contract (Phase 2)

**Do not change frontend in Phase 1.** Use this when wiring Phase 2.

## Base URL

| Variable | Value |
|----------|--------|
| `VITE_API_BASE_URL` | `http://localhost:3000/api/v1` |
| `VITE_AUTH_BASE_URL` | `http://localhost:3000` (optional IAM proxy) |

## Route prefixes (via gateway)

| UI area | Methods | Prefix / examples |
|---------|---------|-------------------|
| Leads | GET, POST, PATCH, DELETE | `/leads`, `/leads/:id`, lifecycle subpaths |
| Opportunities | GET, POST, PATCH | `/opportunities`, `/opportunities/:id`, `/opportunities/pipeline` |
| RFP | GET, POST, PATCH | `/rfps`, `/rfps/:id`, nested document/extraction |
| Documents | POST (multipart), GET | `/uploads`, `/documents/:id`, versions |
| Approvals | POST, GET | `/approvals`, `/decisions` |
| Assignments | GET, POST | `/assignments`, `/handoffs`, `/requirements` |
| Compliance | GET, POST | `/frameworks`, `/assessments`, `/configurations` |

## Headers

| Header | When |
|--------|------|
| `Cookie` + `X-CSRF-Token` | When Command Module auth enabled (existing `apiClient.js`) |
| `x-mock-token` or `Authorization: Bearer <token>` | **Approval** routes (development only) |
| `x-changed-by` | Lead writes (until IAM user mapped) |
| `x-compliance-actor-id` | Compliance mutations |

## Sample: list leads

```http
GET /api/v1/leads HTTP/1.1
Host: localhost:3000
```

Response: JSON array of lead objects (fields per `Lead` entity / Lead Service Swagger).

## Sample: health

```http
GET /health HTTP/1.1
Host: localhost:3000
```

## Limitations

- Approval data **not durable** (in-memory).
- Lead convert → Opportunity **not automated** (stub).
- Compliance may need seed frameworks/assessments for non-empty lists.
- Document upload **blocked** without MinIO/ClamAV.
- Gateway **502** if target service is down.

## CORS

`CORS_ORIGINS=http://localhost:5173` in `apps/api-gateway/.env`; `credentials: true`.