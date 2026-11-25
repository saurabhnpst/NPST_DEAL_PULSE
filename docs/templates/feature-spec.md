# Feature Spec — [Name]

**Scope tag:** [Scope 1 / Scope 2]  
**Related user story:** [US-XX]  
**Owner:** [Role, not person]  
**Status:** [Draft / Ready for review]

## Problem

[Short problem statement.]

## Outcome

[Measurable outcome. Avoid invented thresholds.]

## In Scope

- [Behavior]

## Out of Scope

- [Behavior]

## Required Schemas

Define before implementation.

```ts
// Request schema
// Response schema
// Domain state schema
```

## Workflow States

| From | Action | To | Guard | Actor |
|---|---|---|---|---|
| [state] | [action] | [state] | [permission + rule] | [role] |

## Permissions

- Role: [TBD]
- Team/territory/product vertical: [TBD]
- Ownership/task/document: [TBD]
- Server-side enforcement required: yes

## Data Integrity

- Preserve history: [yes/no]
- Versioned fields: [list]
- Confirmed values: [update rule]
- Idempotency key: [TBD]
- Conflict response: [TBD]

## Notifications

- Event ID: [TBD]
- Channels: Teams + email if Scope 1
- Pending uniqueness: `entity_id + event_type + assignee`
- Comment required actions: Reject / Send back / Return where applicable

## Acceptance Criteria

- [ ] [Criterion]

## Verification

- `npm --prefix frontend run build`
- `npm --prefix backend run build`
- `npm --prefix backend test -- --passWithNoTests`

## Open Questions

- [TBD]
