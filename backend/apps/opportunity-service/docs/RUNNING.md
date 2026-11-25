# Running the project (Opportunity Service)

All backend commands run from **`backend/`**.

## 1. Prerequisites
- Node.js **20+** (tested on 22) and npm
- A MySQL 8 database: the shared **Aiven** instance, or local MySQL via Docker
- Optional: Docker Desktop (local MySQL / RabbitMQ / Redis)

## 2. First-time setup

```bash
cd backend
npm install
```

> **Windows note:** if a command says *"'jest' is not recognized"*, `node_modules` was installed on another OS.
> Delete `backend/node_modules` and run `npm install` again on your machine.

### Database connection: `.env`
The service reads `backend/.env` or, if that's missing, the repo-root `.env`. Don't commit this file.

**Option A: Aiven (shared cloud MySQL)**
```env
DB_HOST=<aiven-host>
DB_PORT=<aiven-port>
DB_USER=<user>
DB_PASSWORD=<password>
DB_NAME=opportunity_db
DB_SSL_MODE=REQUIRED
# Optional, for full certificate checks: download ca.pem from the Aiven console
# DB_SSL_CA=./ca.pem
# DB_SSL_REJECT_UNAUTHORIZED=true
```

**Option B: local MySQL in Docker**
```bash
# The shared docker-compose.yml has no MySQL (the team uses Aiven), so start one directly:
docker run -d --name opp-mysql -p 3306:3306 \
  -e MYSQL_ROOT_PASSWORD=local_root_change_me -e MYSQL_DATABASE=opportunity_db \
  -e MYSQL_USER=dealplus -e MYSQL_PASSWORD=local_change_me mysql:8.4
```
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=dealplus
DB_PASSWORD=local_change_me
DB_NAME=opportunity_db
```

### Create the tables
```bash
npm run opp:migrate        # creates all 7 tables
npm run opp:migrate:show   # [X] 1 OpportunitySchema1732200000000 = done
```

## 3. Start the service
```bash
npm run start:opportunities
# or, if the nest CLI isn't found:
node node_modules/@nestjs/cli/bin/nest.js start opportunity-service --watch
```
Wait for `opportunity-service listening on http://localhost:3005/api/v1/health`.

Check it:
```bash
curl http://localhost:3005/api/v1/health
# {"service":"opportunity-service","status":"ok","database":"connected",...}
```

## 4. Quick manual test
```bash
# create
curl -X POST http://localhost:3005/api/v1/opportunities -H "content-type: application/json" -H "x-user-id: 1" \
  -d '{"name":"Test deal","accountName":"Test Bank","closeDate":"2027-03-31","arr":1000000,
       "products":[{"productSlot":1,"productTsp":"UPI","modules":["TPAP"]}]}'

# read / list / update
curl http://localhost:3005/api/v1/opportunities/OPP-2026-00001
curl "http://localhost:3005/api/v1/opportunities?search=Test"
curl -X PATCH http://localhost:3005/api/v1/opportunities/OPP-2026-00001 -H "content-type: application/json" \
  -d '{"region":"Domestic","champion":true}'

# move stage (Qualification = 0)
curl -X POST http://localhost:3005/api/v1/opportunities/OPP-2026-00001/stages/0/proceed
```
All endpoints: [`../API.md`](../API.md).

## 5. Run with the frontend
```bash
cd frontend
npm install
npm run dev            # http://localhost:5173
```
`frontend/.env` (copy `frontend/.env.example`):
```env
VITE_OPPORTUNITY_API_URL=http://localhost:3005/api/v1
# VITE_USE_OPPORTUNITY_API=false   # demo data only, no backend
```
Log in, open **Opportunities**, and create a deal: it's saved through this service.

## 6. Tests
```bash
npm run test:opportunities                 # all opportunity-service tests (no DB needed)
npm run test:opportunities -- stages       # only files whose path matches "stages"
node node_modules/typescript/bin/tsc --noEmit -p apps/opportunity-service/tsconfig.app.json   # type-check
```

## 7. Everyday commands

| Task | Command (from `backend/`) |
|---|---|
| Start (watch) | `npm run start:opportunities` |
| Apply migrations | `npm run opp:migrate` |
| See applied migrations | `npm run opp:migrate:show` |
| Drop all opportunity tables (**dev only, deletes data**) | `npm run opp:migrate:revert` |
| Rebuild empty dev tables | `npm run opp:migrate:revert && npm run opp:migrate` |
| Build | `node node_modules/@nestjs/cli/bin/nest.js build opportunity-service` |
| Port | `OPPORTUNITY_SERVICE_PORT=3005` (default) |
| Run migrations on start | `OPPORTUNITY_DB_MIGRATE=true` |

## 8. Troubleshooting

| Symptom | Fix |
|---|---|
| `'jest' / 'nest' is not recognized` | Reinstall `node_modules` on this OS, or use the `node node_modules/...` commands above |
| `Port 3005 is already in use` | Stop the other instance or set `OPPORTUNITY_SERVICE_PORT` |
| Health shows `database: disconnected` | Check `.env` values, network or VPN, and `DB_SSL_MODE=REQUIRED` for Aiven |
| Warning `DB_SSL_CA is set but the CA file was not found` | Harmless (still encrypted). Download `ca.pem` from Aiven or remove `DB_SSL_CA` |
| `ER_NO_SUCH_TABLE` | Run `npm run opp:migrate` |
| 400 `VALIDATION_ERROR` | Read `error.details`: it lists each bad field |
| 400 "Fill these first" on proceed | `error.details` lists the missing fields for that stage |
| Changed `schema.sql` and the tests fail | Update the migration with the same SQL (`schema.spec.ts` compares them) |

## 9. Where things are
```
backend/apps/opportunity-service/
├── API.md                  ← endpoint contract
├── README.md               ← short overview + "adding a field"
├── docs/                   ← ARCHITECTURE, RUNNING (this file), TEAM-GUIDE
├── database/schema.sql     ← full SQL
├── src/
│   ├── main.ts, app.setup.ts, app.module.ts
│   ├── opportunities/      ← CRUD + opportunity-fields.ts (field list)
│   ├── stages/             ← stage rules + actions
│   ├── commercials/ po/ activities/ history/ fallback/
│   ├── revenue/ contributors/ products/   ← thin views over the record
│   ├── common/             ← validation, actor header, errors, calculations
│   ├── entities/ migrations/ events/ config/ integrations/
└── test/                   ← HTTP tests
```
