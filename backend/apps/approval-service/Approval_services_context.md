## Implementation context additions

### Scope decisions

- Build `approval-service` only.
- Do not implement authentication, database integration, assignment-service or CXO/proposal decision gates.
- Assignment is a future standalone service. Approval uses a local mock repository for lead assignment, roles and hierarchy only.
- All 13 supplied endpoint names and paths are fixed.
- Sales recommendation is deferred. `POST /decisions/:id/recommendation` stays `501` until product defines behavior.
- `POST /approvals/:id/request-changes` stays `501` until product defines behavior.

### Domain seam and creation

- Approval requests are created when a lead is submitted, not when a lead is created.
- Creation uses the internal domain seam `ApprovalLifecycleService.submit()`.
- No new HTTP endpoint is added for lead creation or submission.
- A future lead-service event or adapter can call the domain seam.
- Duplicate active submission with the same idempotency key returns the existing request.
- Duplicate active submission with a different idempotency key returns `409`.
- After a terminal decision, a new submission may create a new request and must preserve prior history.

### Approval states

- `PENDING_PNL_HEAD` → `PENDING_SALES_MANAGER` → `APPROVED | REJECTED`.
- Only one active approval per lead.
- Timeout transfers authority; it does not create a decision.
- `approve` and `proceed` use the same domain transition and create one decision.
- `reject` and decision `reject` use the same domain transition and create one decision.
- Rejection reason is mandatory. Approval comment is optional.

### Authority and escalation

- Initial authority is P&L Head. After timeout, authority is Sales Manager.
- Only the current approver can approve or reject.
- Authority is enforced server-side on reads and actions.
- Escalation runs before action processing when `now >= expiresAt`.
- Timeout transfers are atomic and idempotent.
- Transfer history records original approver id, new approver id and transfer timestamp.
- Repeated escalation must not create duplicate transfer history.
- Terminal approvals are never reopened by expiry or scheduler.
- Local timeout transfer is an explicit user-approved exception for mock verification only; it is not production policy or an agreed SLA.
- Missing P&L Head or Sales Manager mapping returns a controlled `422`.
- One P&L approver per request. Multi-P&L approval is a future requirement.
- If Sales Manager is also lead creator, self-approval returns controlled `409`; request remains pending.

### Actor context

- Actor identity comes from a signed local dev mock token.
- Clients do not supply actor id or role in request bodies.
- Server validates token signature and expiry, then resolves actor from mock directory.
- Role comes only from server-side mock data.
- `MockApprovalPolicy` enforces role, team, territory, product vertical, ownership, current-approver authority and optional task/document grants; deny by default.

### Mock and fixture catalog

- Canonical typed fixtures: `src/mock/fixtures.ts` (`MOCK_ACTORS`, mappings, `buildSubmitApprovalInput`, `MOCK_SAMPLE_SUBMIT`).
- Unwired noop ports (not in `AppModule`): `src/shared/notification-client.ts`, `src/shared/document-client.ts`, `src/shared/deferred-actions.ts`.
- Full dependency inventory and swap checklist: `DEPENDENCY_HANDLING.md`.

### Technical model

- Domain services depend on ports injected via `APPROVAL_REPOSITORY`, `ASSIGNMENT_REPOSITORY`, `APPROVAL_EVENTS`, `ACTOR_DIRECTORY` and `APPROVAL_POLICY`.
- In-memory adapters implement approval repository, decision repository and event publisher.
- Mock assignment adapter supplies lead assignment, role hierarchy and approver mappings.
- Repository version checks provide atomic compare-and-set transitions.
- Approval state, decision and history are committed in one repository operation.
- Reads are scoped to the actor’s assigned approvals, plus creator access to own request status/history.

### Escalation configuration

- `APPROVAL_ESCALATION_MS` is local-test-only.
- Local default is for development and testing; it is not an agreed business SLA.
- Production startup fails unless an approved business timeframe is explicitly configured and enabled.
- In-process scheduling is development-only, not a production distributed scheduler.

### Testing requirements

Tests must cover initial authority, missing mappings, duplicate submission, rejected resubmission, self-approval, unauthorized reads/actions, exact expiry boundary, simultaneous escalation and approval, repeated escalation, duplicate decisions, alias parity, mandatory rejection reason, optional approval comment and `501` endpoints.
