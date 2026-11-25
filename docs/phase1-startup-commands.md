# Phase 1 — Exact Startup Commands

Run from **`backend/`** after copying each `apps/<service>/.env.example` → `.env` and setting shared `DB_*` + per-service `DB_NAME`.

```bash
# Optional infra (local)
cd /path/to/NPST_DEAL_PULSE
docker compose up -d mysql redis minio

# Per-service (separate terminals or process manager)
cd backend
npm run start:leads          # :3002
npm run start:opportunities  # :3003
npm run start:documents      # :3005
npm run start:rfp            # :3004
npm run start:approvals      # :3006
npm run start:assignments    # :3007
npm run start:compliance     # :3008
npm run start:gateway        # :3000

# Migrations (when needed; no drop/reset)
npm run migration:lead:run
npm run opp:migrate
npm run migration:run
npm run migration:run:rfp
npm run migration:run:approval
npm run asg:migrate
# compliance: see apps/compliance-service/src/database/README.md

# Smoke
curl http://localhost:3000/health
curl "http://localhost:3000/api/v1/leads?limit=1"
node scripts/phase1-smoke.mjs
```

**Port 3000 conflict:** `fuser -k 3000/tcp` only if you know nothing else needs that port, or set `PORT` in `apps/api-gateway/.env` and update `VITE_API_BASE_URL` for demos.