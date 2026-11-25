# Command Module integration (auth_gateway)

DealPlus does **not** implement its own Auth Service. Authentication is provided by the external **Command Module** repository:

[https://github.com/AdityaSinghNPST/auth_gateway](https://github.com/AdityaSinghNPST/auth_gateway)

## What the Command Module provides

| Component | Technology | Purpose |
|-----------|------------|---------|
| **iam-api** | NestJS on port **3012** (host) / **3000** (in platform compose) | Login, sessions, RBAC, `/api/me` |
| **Keycloak** | Port **8180** | Identity provider (username/password) |
| **PostgreSQL** | `iam_db` on port **5433** | IAM metadata (not MySQL) |
| **Redis** | Session store `sess:{sessionId}` | Shared session records |
| **Platform gateway** | NGINX port **8080** | Reference edge gateway for HR portal |

Authentication is **cookie + CSRF**, not DealPlus-issued JWTs.

### Public auth APIs (proxied by DealPlus API Gateway)

| Method | Path | Notes |
|--------|------|-------|
| POST | `/api/auth/login` | Body: `{ username, password, returnUrl? }` → `{ csrfToken }` + `session_id` cookie |
| GET | `/api/auth/csrf` | Requires session cookie |
| POST | `/api/auth/logout` | Requires `X-CSRF-Token` |
| GET | `/api/me` | Profile, roles, permissions |

Internal validation used by the platform gateway:

| Method | Path | Notes |
|--------|------|-------|
| GET | `/internal/session/validate` | Returns `X-User-Id`, `X-Tenant-Id` headers (204) |

Service-to-service registration (future DealPlus permission model):

| Method | Path | Auth |
|--------|------|------|
| POST | `/internal/permissions/register` | `Authorization: Bearer <service-secret>` |

## DealPlus integration architecture

```
Browser (Vite :5173)
    │  credentials: include
    ▼
DealPlus API Gateway (:3000)
    ├── /api/auth/*  ──proxy──►  iam-api (IAM_API_URL)
    ├── /api/me/*    ──proxy──►  iam-api
    └── /api/v1/*    ──proxy──►  lead / document / rfp / … services
                                      │
                                      ▼
                              REDIS_SERVICE_URL (read sess:*)
                              CommandModuleAuth guard (when configured)
```

Microservices validate the **same Redis session** as iam-api via `REDIS_SERVICE_URL` (read-only ACL user from auth_gateway `.env.example`: `REDIS_SERVICE_URL`).

Implementation: `backend/libs/command-module-auth` (aligned with auth_gateway `auth-shared`).

When `REDIS_SERVICE_URL` is empty, services run in **passthrough** mode (local UI without IAM).

## Running the Command Module locally

From a clone of `auth_gateway`:

```bash
cp .env.example .env
cd platform/infra
docker compose -f docker-compose.platform.yml up -d --build
```

Run **iam-api** on a port that does not conflict with DealPlus gateway (**3012** recommended):

```bash
cd platform/apps/iam-api
PORT=3012 npm run start:dev
```

Set in `backend/apps/api-gateway/.env`:

```env
IAM_API_URL=http://localhost:3012
CORS_ORIGINS=http://localhost:5173
```

Add DealPlus frontend origin to Command Module `ALLOWED_RETURN_ORIGINS` in auth_gateway root `.env`.

### Development users (from auth_gateway README)

| Username | Password |
|----------|----------|
| admin | DevPassword123! |
| manager | DevPassword123! |
| employee | DevPassword123! |

Keycloak realm: `auth_gateway`, client: `iam-api`.

## Outstanding items for the IAM team

1. **DealPlus application registration** in iam-api (`/internal/permissions/register`) with product key e.g. `dealplus` and permission keys matching DealPlus verticals/workflows.
2. **Service credential** for DealPlus (`IAM_INTERNAL_SERVICE_SECRET` / per-service secret) for permission sync and optional internal session introspection.
3. **REDIS_SERVICE_URL** (read-only) credentials for each DealPlus environment shared securely.
4. **CORS / cookie domain** plan for production (shared parent domain vs reverse proxy).
5. Confirm whether DealPlus should sit behind the **platform NGINX gateway (:8080)** or keep the **Nest API Gateway (:3000)** as the only public edge (current implementation).
6. **User provisioning** in Keycloak for NPST sales verticals (today usernames are generic admin/manager/employee).

DealPlus must **not** duplicate iam-api logic or create `auth-service` endpoints for login.