# Implementation Plan — [Feature]

**Plan status:** [Draft / Approved]  
**Scope tag:** [Scope 1 / Scope 2]  
**Approver:** [Role / TBD]

## Goal

[One paragraph.]

## Constraints

- No CI/CD. No `.github/workflows`, CI YAML or pipeline config.
- Preserve PRD TBDs.
- No auth, billing or database schema edits without explicit authorization.
- Strict schemas before business logic.
- No `any`.
- Server-side permissions.

## Steps

1. Inspect [files].
2. Add/update schemas in [location].
3. Add domain rules in [location].
4. Add API/event handlers in [location].
5. Add frontend view/service changes in [location].
6. Add notification event if required.
7. Add tests for happy path, permission denial, stale action and non-200 response.
8. Run local verification.
9. Update docs and audit notes.

## Files Expected to Change

| File | Change |
|---|---|
| [path] | [change] |

## Risks

| Risk | Mitigation |
|---|---|
| [risk] | [mitigation] |

## Verification

- [ ] `npm run verify`
- [ ] Frontend build
- [ ] Backend build
- [ ] Backend tests
- [ ] Manual state walkthrough
- [ ] Permission walkthrough

## Rollback / Recovery

[Manual rollback steps. No deployment automation.]
