# Running the Assignment Service

All commands run from **`backend/`**.

## 1. First-time setup
```bash
cd backend
npm install
```
`.env` (in `backend/` or the repo root; never commit it) needs the shared MySQL values:
```env
DB_HOST=<aiven-host>
DB_PORT=<aiven-port>
DB_USER=<user>
DB_PASSWORD=<password>
DB_SSL_MODE=REQUIRED
# Optional: ASSIGNMENT_DB_NAME=assignment_db (default). The shared DB_NAME is ignored on purpose.
```

Create the database once, if it doesn't exist (any MySQL client):
```sql
CREATE DATABASE IF NOT EXISTS assignment_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```
Then create the tables:
```bash
npm run asg:migrate        # 6 tables
npm run asg:migrate:show   # [X] 1 AssignmentSchema1732300000000
```

## 2. Start
```bash
npm run start:assignments
```
Check it:
```bash
curl http://localhost:3007/api/v1/health
# {"status":"ok","database":"connected","integrations":{"auth":"mock","notification":"mock","rfp":"mock","opportunity":"mock"}}
```
Swagger: **http://localhost:3007/api/docs**. Use **Authorize** to set `x-user-id`.

### With the real Opportunity Service
Start it first (`npm run start:opportunities`, port 3005), then:
```bash
# Git Bash / Linux / macOS
OPPORTUNITY_SERVICE_URL=http://localhost:3005 npm run start:assignments
# PowerShell
$env:OPPORTUNITY_SERVICE_URL="http://localhost:3005"; npm run start:assignments
```
Or put `OPPORTUNITY_SERVICE_URL=http://localhost:3005` in `.env`. Health then shows `"opportunity":"real"`.

## 3. Try the whole flow (mock users)
Demo users (mock Auth): **2 Priya S.** (Sales), **5 Vikram N.** (Solution Manager + Pre-Sales),
**6 Sneha G.** (Pre-Sales + Tech Lead), **7 / 8** demo Tech Leads (UPI / BBPS), **9** an inactive Tech Lead.

```bash
B=http://localhost:3007/api/v1; J='content-type: application/json'

# 1) master: UPI → user 7, BBPS → user 8
curl -X POST $B/product-verticals -H "$J" -H "x-user-id: 1" -d '{"productTsp":"UPI","techLeadUserId":7}'
curl -X POST $B/product-verticals -H "$J" -H "x-user-id: 1" -d '{"productTsp":"BBPS","techLeadUserId":8}'

# 2) auto-assign (mock RFP gives 6 sample requirements); use a real OPP id if the Opportunity Service is connected
curl -X POST $B/assignments/opportunity/OPP-2026-00001/auto-assign -H "$J" -H "x-user-id: 2" -d '{}'

# 3) Solution Manager queue, then approve (use an id from the list)
curl "$B/assignments?status=PENDING_APPROVAL"
curl -X POST $B/assignments/1/approve -H "$J" -H "x-user-id: 5" -d '{"comment":"Go ahead"}'

# 4) review queue: map a requirement to a product
curl "$B/requirements/review-queue?opportunityId=OPP-2026-00001"
curl -X PATCH $B/requirements/5 -H "$J" -H "x-user-id: 5" -d '{"productTsp":"UPI"}'

# 5) handoff: Sales asks, Pre-Sales Manager accepts with Solutions owner 5
curl -X POST $B/handoffs -H "$J" -H "x-user-id: 2" -d '{"title":"AePS tender support","opportunityId":"OPP-2026-00001","dueDate":"2026-12-05","pendingInputs":["Signed NDA"]}'
curl -X POST $B/handoffs/1/accept -H "$J" -H "x-user-id: 5" -d '{"assigneeUserId":5}'
```
In mock mode, notifications are printed in the service log as `→ <name>: <title>`.

## 4. Tests
```bash
npm run test:assignments                    # 26 tests, no database needed
npm run test:assignments -- requirement     # only files matching "requirement"
npx tsc --noEmit -p apps/assignment-service/tsconfig.app.json   # type-check
```

## 5. Everyday commands
| Task | Command |
|---|---|
| Start (watch) | `npm run start:assignments` |
| Apply migrations | `npm run asg:migrate` |
| Applied migrations | `npm run asg:migrate:show` |
| Drop all tables (**dev only, deletes data**) | `npm run asg:migrate:revert` |
| Port | `ASSIGNMENT_SERVICE_PORT` (default 3007) |

## 6. Troubleshooting
| Symptom | Fix |
|---|---|
| `Unknown database 'assignment_db'` | Run the `CREATE DATABASE` above, then `npm run asg:migrate` |
| Health `database: disconnected` | Check `.env`, network, `DB_SSL_MODE=REQUIRED` for Aiven |
| 400 "The x-user-id header is required…" | Send `x-user-id` (Swagger: Authorize) |
| 403 "… needs role SOLUTION_MANAGER" | Use a Solution Manager (mock user 5) |
| 404 "Opportunity OPP-… not found" | With the real Opportunity Service, use an id that exists there |
| 503 "Opportunity Service is unavailable" | Start it, or unset `OPPORTUNITY_SERVICE_URL` to use the mock |
| `Port 3007 is already in use` | Stop the other instance or set `ASSIGNMENT_SERVICE_PORT` |
