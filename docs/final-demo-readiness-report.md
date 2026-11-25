# Final Demo Readiness Report

## Quick start (copy-paste)

```bash
cd /home/saurabh-soni/Desktop/NPST_DEAL_PULSE

# Optional: document infra
npm run infra:up

# Backend + gateway (one command)
npm run start:backend

# New terminal — frontend
npm run start:frontend

# Optional smoke
npm run smoke
```

**Open:** http://localhost:5173  
**API:** http://localhost:3010/api/v1  
**Swagger:** http://localhost:3010/api/docs  

Ensure `frontend/.env` has:

```env
VITE_API_BASE_URL=http://localhost:3010/api/v1
```

---

## Manual verification checklist

### Infrastructure

- [ ] `npm run ports:check` — gateway 3010 free or intentionally in use
- [ ] MySQL reachable from all seven `apps/*/service/.env`
- [ ] (Optional) `docker ps` shows LocalStack + ClamAV after `infra:up`

### Gateway

- [ ] http://localhost:3010/health → `status: ok`
- [ ] http://localhost:3010/health/ready → all upstreams `ok: true`
- [ ] http://localhost:3010/api/docs loads seven API groups
- [ ] Try GET `/leads` from Swagger (Lead spec)

### Leads

- [ ] Login → vertical → **Leads** list loads from API
- [ ] Open lead → **Save** persists (PATCH)
- [ ] **Submit for approval** → status Working, pending
- [ ] Switch to P&L vertical → **Approve** → Qualified; new opportunity in **Opportunities**

### Opportunities

- [ ] **Pipeline** / list shows API data
- [ ] **New opportunity** creates via API (not fake id)

### RFP

- [ ] RFP data loads if backend has rows (store `rfps` from API)
- [ ] Synopsis screen: note PARTIAL local workflow vs backend RFP entities

### Documents

- [ ] With infra up: upload via UI or Postman `POST /api/v1/uploads` (multipart)

### Approvals

- [ ] Set `VITE_APPROVAL_MOCK_TOKEN` and reload approvals in network tab

### Compliance

- [ ] GET frameworks via gateway (Postman or browser network from future UI)
- [ ] Compliance page: matrix still partly UI-driven — confirm opportunities list is real

### Dashboard

- [ ] KPIs use leads/opportunities counts from API (not seed data)

---

## Stop cleanly

```bash
npm run stop:backend
npm run infra:down    # if you started docker infra
```

---

## Demo talking points

1. Single gateway entry (`3010`) for all React API calls.
2. Central Swagger at `/api/docs` with gateway-patched OpenAPI.
3. Real MySQL persistence across seven databases (no mock DB).
4. Lead approval triggers Opportunity Service HTTP integration.