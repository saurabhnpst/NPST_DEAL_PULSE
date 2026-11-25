# auth-service

Local development identity API for DealPlus when Command Module iam-api is not running.

- Port: `3001` (see `PORT`)
- Health: `GET /api/v1/health`
- Login: `POST /api/auth/login` → `session_id` cookie + `{ csrfToken }`
- Profile: `GET /api/me`
- Logout: `POST /api/auth/logout` (requires `X-CSRF-Token`)
- CSRF: `GET /api/auth/csrf` (requires session cookie)

Sessions are stored in Redis (`sess:{sessionId}`) using the same shape as `libs/command-module-auth`.

Copy `apps/auth-service/.env.example` → `.env`, set `AUTH_LOCAL_USERS` and `AUTH_REDIS_URL`, then point `IAM_API_URL=http://localhost:3001` in `apps/api-gateway/.env`.
