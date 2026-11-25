# API Contract — [Endpoint Name]

**Service:** [service]  
**Base path:** `/api/v1`  
**Method + path:** [GET / POST / PATCH] [path]  
**Scope tag:** [Scope 1 / Scope 2]

## Purpose

[What this endpoint does.]

## Permissions

- Required role: [TBD]
- Record access: [ownership/team/territory/product vertical/task/document]
- Server-side enforcement: required

## Request Schema

```ts
interface Request {
  [field]: [type];
}
```

## Response Schema

```ts
interface SuccessResponse {
  [field]: [type];
}

interface ErrorResponse {
  code: string;
  message: string;
  details?: unknown;
}
```

## Validation

- [Field rule]
- [Stage/state guard]
- [Comment requirement]
- [Duplicate/stale guard]

## Idempotency

- Key: [TBD]
- Duplicate behavior: [TBD]
- Conflict response: `409` with reason

## Errors

| Status | Condition | Response code |
|---|---|---|
| 400 | Invalid schema | [code] |
| 401 | Unauthenticated | [code] |
| 403 | Unauthorized | [code] |
| 404 | Not found or not visible | [code] |
| 409 | Stale/duplicate/conflict | [code] |
| 502 | Dependency failure | [code] |

## Events Emitted

- [Event name + version]

## Audit

Record actor, entity, action, timestamp, previous value, new value and reason.

## Open Questions

- [TBD]
