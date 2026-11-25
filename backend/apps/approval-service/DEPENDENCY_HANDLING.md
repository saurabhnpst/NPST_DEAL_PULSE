# Approval service dependency handling

**Status:** Draft  
**Scope tag:** Scope 1 + future seams  
**Current mode:** local mock-only execution  
**Rule:** APIs or versioned events only. No cross-service DB joins or direct writes. Preserve PRD TBDs.  
**Sources:** `AGENTS.md`; `docs/api/api-catalog.md:48-53`; `docs/architecture/microservices.md`; `docs/database/ownership.md`; `docs/permission-matrix.md`; `docs/notification-matrix.md`; `docs/workflow-states.md`; `docs/TBD-register.md`; `backend/apps/approval-service/Approval_services_context.md`.

## Purpose

- Run approval-service now with local data and no external systems.
- Keep one swap point per dependency.
- Remove mocks by replacing edge adapters only.
- Keep domain rules, status transitions, history and API paths stable.
- Do not invent approvers, routing, SLAs, stages, folders or final approvers.

## Fixture source

Canonical typed fixtures for local development and tests: [`src/mock/fixtures.ts`](src/mock/fixtures.ts).

| Export | Purpose |
|---|---|
| `MOCK_ACTORS` | Generic demo actors with roles/team/territory/vertical scopes (not real people) |
| `MOCK_APPROVER_MAPPINGS` | `UPI`, `BBPS`, `default` vertical → P&L Head / Sales Manager ids |
| `MOCK_ACTOR_IDS` | Stable actor id constants for tests |
| `MOCK_LEAD_IDS` / `MOCK_SUBMIT_BASE` | Shared lead, team, territory, product vertical defaults |
| `buildSubmitApprovalInput(overrides?)` | `SubmitApprovalInput` with optional partial override |
| `MOCK_SAMPLE_SUBMIT` | Doc/manual sample for domain `submit` + `parseSubmitApprovalInput` |
| `mockActor(actorId, role)` | Small helper for test harness actors |

`MockDirectory` loads `MOCK_ACTORS` and `MOCK_APPROVER_MAPPINGS` from this module. Override via `addActor` / `setMapping` in tests as today.

Local env (root [`.env.example`](../../../.env.example)): `APPROVAL_MOCK_TOKEN_SECRET`, `APPROVAL_TOKEN_TTL_SECONDS`, `APPROVAL_ESCALATION_ENABLED`, `APPROVAL_ESCALATION_MS` (local test only), `APPROVAL_ESCALATION_APPROVED`.

## Current mock inventory

| Area | Current seam | Mock implementation | Real target |
|---|---|---|---|
| Actor identity | `ACTOR_DIRECTORY`; `src/mock/mock-actor.guard.ts:8`; `src/mock/actor.decorator.ts:5` | `MockTokenCodec`, `MockActorGuard`, `MockDirectory` | Auth Service / API Gateway JWT + M365 identity |
| Assignment data | `ASSIGNMENT_REPOSITORY`; `src/mock/approver-assignment.repository.ts:8` | `MockDirectory` with generic actors and UPI/BBPS/default mapping | Assignment Service |
| Persistence | `APPROVAL_REPOSITORY`; `src/approvals/approval.repository.ts:17`; `src/approvals/in-memory-approval.repository.ts:16` | `InMemoryApprovalRepository` Maps with version checks | Service-owned `approval_db` |
| Events | `APPROVAL_EVENTS`; `src/shared/event-publisher.ts:8` | `InMemoryApprovalEventPublisher` | RabbitMQ + outbox |
| Permissions | `APPROVAL_POLICY`; `src/shared/approval-policy.ts:5` | `MockApprovalPolicy` deny-by-default scope/ownership checks | Real policy service/provider with server-side grants |
| Escalation | `src/shared/approval-escalation.scheduler.ts:9` | In-process `setInterval`, local env window | Durable scheduler + approved business timeframe |
| Config/secrets | `src/shared/config.ts:9` | `process.env`, local defaults | Config/secrets manager |
| Clock | `src/shared/clock.ts:1` | `SystemClock`, injected `CLOCK`; `TestClock` in tests | System time; keep seam |
| Notification delivery | `src/shared/notification-client.ts:1` | `NoopNotificationClient` (**unwired** in `AppModule`) | Notification Service |
| Document references | `src/shared/document-client.ts:1` | `NoopDocumentClient` (**unwired**) | Document Service / MinIO |
| Deferred workflow actions | `src/shared/deferred-actions.ts:1` | `NoopDeferredActions` throws `501` (**unwired**) | Product-defined `request-changes` / Sales recommendation |

## Unwired noop stubs

`NoopNotificationClient`, `NoopDocumentClient`, and `NoopDeferredActions` are swap targets only. They are **not** registered in `src/app.module.ts` in the mock phase.

- **Notification:** `enqueuePending` is a no-op; pending queues remain in-memory list filters on HTTP endpoints.
- **Document:** `resolveReference` always returns `undefined`; only comment/reason strings exist on approvals today.
- **Deferred actions:** `NoopDeferredActions` uses the same `notImplementedError` messages as controllers until product defines behavior. Controllers continue to own HTTP `501` responses.

When integrating: implement the port interface, wire the real adapter (or delegate controllers to `DeferredActions`) in `app.module.ts`, and remove or narrow the noop class.

## Dependency handling

| Dependency | Why needed | Now: mock/local handling | Later: integration handling | Guardrails |
|---|---|---|---|---|
| Auth / identity | Trusted actor id and role | Signed HMAC mock token carrying `actorId` + `exp`; server resolves role from `MockDirectory`. Accepts `Bearer` or `x-mock-token`. | Replace `MockTokenCodec` and `MockActorGuard` with Gateway/JWT/M365 verification. Keep `Actor` decorator and request-scoped actor context. | Client never sends actor id or role. No secrets in logs/errors. Production requires real configured secret. |
| Permissions / scope | Role alone insufficient | `MockApprovalPolicy` enforces role, team, territory, product vertical, ownership, current approver and optional task/document grants. Self-approval blocked after transfer. | Replace mock policy via `APPROVAL_POLICY` with real server-side grants. | Deny by default. Preserve `403/404/409` semantics. Do not resolve TBD routing rules. |
| Assignment / approver mapping | Initial approver + timeout approver | `ApproverAssignmentRepository` port; `MockDirectory` supplies generic P&L Head and Sales Manager IDs. | Implement same port with Assignment Service adapter/events. | No hardcoded employee names, reporting lines or approvers. Multi-P&L remains future requirement. |
| Lead submission trigger | Approval starts on lead submit | Domain seam `ApprovalLifecycleService.submit()`; no HTTP submit endpoint. Input parsed by `parseSubmitApprovalInput()`. | Lead Service event consumer or authorized adapter calls same seam. | Consumer must be idempotent. One active approval per lead. New request allowed only after terminal decision. |
| Persistence | Durable approval, decision, version, history | In-memory Maps; version compare-and-set; decision and history committed with state. | Implement `ApprovalRepository` with service-owned MySQL `approval_db`; transaction wraps state, decision, history and outbox row. | No cross-service joins or direct writes. No schema change without explicit authorization. Never overwrite confirmed data. |
| Event bus | Cross-service workflow signals | In-memory publisher emits `approval.submitted.v1`, `approval.decided.v1`, `approval.authority-transferred.v1` with `schemaVersion` and `producer`. | RabbitMQ adapter with versioned envelope, `eventId`, `correlationId`, outbox, retry and DLQ. | Consumers idempotent. Payload contains IDs only; no document bodies or commercial data. |
| Notification / Portal queue | Teams/email delivery and pending work | `NotificationClient` + `NoopNotificationClient` (unwired). Pending endpoints are local filters over in-memory approvals. | Notification Service sends Teams actionable cards and email in parallel; Portal queues/dashboards remain system of work. | One pending per `entity_id + event_type + assignee`. First valid action wins. No separate feed, reminders, due-date nudges or TAT escalation. |
| Escalation / scheduler | Authority transfer at expiry | `ApprovalEscalationScheduler` polls every 60s. `APPROVAL_ESCALATION_MS=1000` is local test-only and user-approved as a local exception. Requires explicit `APPROVAL_ESCALATION_ENABLED=true`; production startup guard requires approved timeframe. | Replace scheduler with durable queue/scheduler using approved business window. Keep domain transfer logic and history. | No auto-approval, auto-reject or silent closure. Local value is not an SLA. Do not invent timeframe. |
| Config / secrets | Environment-specific behavior | `ApprovalConfigService` reads `process.env`; local token secret default. | Inject config provider backed by approved secrets manager. Keep production validation. | No secret logging. No repo CI/CD. Do not add deployment automation. |
| API Gateway | Public routing, auth, correlation | Standalone Nest app on `3006`, prefix `api/v1`, local `DomainErrorFilter`, header fallback `${id}:${outcome}`. | Gateway proxies approved catalog routes, owns auth/rate limiting/correlation middleware. | Keep controllers thin. API catalog paths fixed. Gateway owns no business data. |
| Opportunity / proposal / CXO | Downstream workflow meaning | `proceed` aliases `approve`; controllers return `501` for `request-changes` and `recommendation`; `DeferredActions` / `NoopDeferredActions` port (unwired). | Wire product-defined workflow seams after decisions are made. | CXO is linked governance track, not separate pipeline. Do not invent stages, routing or approval policy. |
| Document / MinIO | Evidence and controlled references | `DocumentClient` + `NoopDocumentClient` (unwired). Only `comment` and `reason` strings exist. | Document Service references with server-side document permissions. | No document bodies in logs/errors. Scope 1 ends at PO receipt; no PO validation/acceptance. Preserve TBDs. |
| Clock | Deterministic expiry tests | `CLOCK` injection; `SystemClock` in app, `TestClock` in tests. | Keep as-is. | Exact boundary is `now >= expiresAt`. Do not replace with business calendar without product decision. |

## Removal checklist

- [ ] Keep `ApprovalLifecycleService` domain API unchanged.
- [ ] Keep DTO parsing and authorization at the edge; controllers stay thin.
- [ ] Replace DI token providers in `src/app.module.ts`, not domain services.
- [ ] Implement each real adapter against existing port/contract before deleting mock.
- [ ] Keep `Actor` decorator after real auth guard replaces `MockActorGuard`.
- [ ] Keep `CLOCK` seam and expiry boundary tests.
- [ ] Keep version checks, idempotency keys, history and audit events intact.
- [ ] Search for `Mock`, `InMemory`, `Noop`, `x-mock-token`, `MOCK_ACTORS`, `MOCK_APPROVER_MAPPINGS`, `APPROVAL_ESCALATION_APPROVED=false`.
- [ ] Remove local-only `.env.example` values only when real config path is wired.
- [ ] Update service context and stale service README only when integration actually lands.

## Forbidden during mock phase

- No authentication, billing, database schema or CI/CD changes without explicit authorization.
- No new dependencies.
- No hardcoded employee names, reporting lines, approvers, reviewers or Tech Leads.
- No separate in-app notification feed.
- No auto-approval, auto-reject, silent closure, reminders, due-date nudges or TAT escalation in Scope 1, except the documented local mock authority-transfer exception.
- No silent overwrite of confirmed business data.
- No cross-service database joins or direct writes.

## Verification after each swap

- Run `npm run verify` from repository root.
- Confirm existing tests still cover authority transfer, missing mapping, duplicate submission, rejected resubmission, self-approval, unauthorized reads/actions, exact expiry boundary, simultaneous escalation/action, repeated escalation, duplicate decisions, alias parity, mandatory rejection reason and `501` endpoints.
- Add adapter-specific contract tests for non-200 responses, retries, timeouts and idempotent delivery.
- Confirm no logs or error payloads expose secrets, tokens, document bodies or sensitive commercial data.

## TBDs / open questions

- Preserve all PRD TBDs. Do not resolve here: `TBD-03`, `TBD-04`, `TBD-05`, `TBD-14`, `TBD-27`, `TBD-30-38`, `TBD-39-44`, `TBD-47`, `TBD-55`, `TBD-61`, `N-TBD-01`, `N-TBD-02`.
- Product must define approval timeout business timeframe before production escalation. Local mock transfer remains an explicit exception only.
- Product must define `request-changes` behavior before replacing its `501`.
- Product must define Sales recommendation behavior before replacing its `501`.
- Assignment Service contract must define authorized, configurable approver mapping before removing `MockDirectory`.
