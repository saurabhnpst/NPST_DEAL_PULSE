# API Gateway Test Report

**Date:** 2026-11-25

| Test | Result | Notes |
|------|--------|-------|
| Gateway build | **PASS** | `nest build api-gateway` |
| Liveness `GET /health` | **PASS** | On port 3800 when 3000 busy |
| Readiness `GET /health/ready` | **PARTIAL** | Probes upstream `/api/v1/health` |
| `GET /api/v1/leads` via gateway | **PARTIAL** | **PASS** when all upstreams running + hybrid proxy; **502** when lead stopped |
| `GET /api/v1/frameworks` via gateway | **PARTIAL** | Same dependency |
| Port 3000 bind | **BLOCKED** | Non-gateway app returns **401** on `/api/v1/*`; use alternate `PORT` (e.g. **3010**) |
| Phase 2 proxy pathname fix | **PASS** | `GET /api/v1/leads` via gateway on 3010 after `requestPathname()` fix |
| Express bootstrap fix | **PASS** | `import * as express from 'express'` |
| Downstream stopped | **PASS** (code) | Returns **502 JSON** from proxy error handler |
| Correlation ID | **PASS** | `X-Correlation-Id` on responses |
| Request logging | **PASS** | `GatewayHTTP` log lines |

## How to re-run (team)

```bash
# 1. Free port 3000 or set PORT in apps/api-gateway/.env
fuser -k 3000/tcp   # only if safe on your machine

# 2. Start all services from backend/
npm run start:leads
npm run start:opportunities
npm run start:documents
npm run start:rfp
npm run start:approvals
npm run start:assignments
npm run start:compliance
npm run start:gateway

# 3. Smoke
curl -s http://localhost:3000/health
curl -s "http://localhost:3000/api/v1/leads?limit=1"
node scripts/phase1-smoke.mjs
```

**Do not claim PASS** until curl succeeds through **port 3000** with your intended `PORT` config.