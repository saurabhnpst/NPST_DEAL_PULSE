# Runbook — [Service / Feature]

**Service:** [name]  
**Owner:** [team/role]  
**Local port:** [TBD]  
**Scope tag:** [Scope 1 / Scope 2]

## Purpose

[What this service/feature does.]

## Local Startup

```bash
cp .env.example .env
docker compose up -d
npm install
npm --prefix backend run start:[service]
npm --prefix frontend run dev
```

## Health Check

- Endpoint: `GET /api/v1/health`
- Expected: [200 response]
- Dependencies: [MySQL/RabbitMQ/Redis/MinIO/Graph]

## Common Failures

| Symptom | Cause | Action |
|---|---|---|
| [Symptom] | [Cause] | [Action] |
| [Symptom] | [Cause] | [Action] |

## Data Safety

- Do not directly query or write another service's database.
- Do not edit confirmed business data without versioning and audit.
- Do not log secrets, tokens, document bodies or commercial details.

## Notification Checks

- [ ] Portal pending state visible
- [ ] Teams delivery attempted
- [ ] Email delivery attempted
- [ ] Failures audited
- [ ] Channel failure did not block workflow

## Manual Recovery

1. [Step]
2. [Step]
3. [Step]

## Escalation

- [Role / TBD]

## Open Questions

- [TBD]
