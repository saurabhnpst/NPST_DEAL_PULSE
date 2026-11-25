# PRD — [Feature / Capability Name]

**Version:** [TBD]  
**Date:** [TBD]  
**Status:** Draft for stakeholder validation  
**Scope tag:** [Scope 1 / Scope 2 / Later / Out of scope]  
**Source PRD section:** [link or section]

## 1. Purpose

[Problem. User value. Why now. Do not restate unrelated PRD content.]

## 2. Scope

### Included

- [Included behavior]
- [Included roles]
- [Included entities]

### Excluded

- [Explicit exclusions]
- [Later-scope behavior]
- [Out-of-Scope 1 behavior]

## 3. Users and Access

| Role | Allowed actions | Access basis |
|---|---|---|
| [Role] | [Action] | [Role/team/territory/product/ownership/task/document] |

No hardcoded employee names, reporting relationships, approvers, reviewers or Tech Leads.

## 4. Workflow

1. [Trigger]
2. [Actor action]
3. [Server validation and authorization]
4. [State transition]
5. [Audit and notification]
6. [Result]

### Edge cases

- Missing data: [behavior]
- Duplicate submission: [behavior]
- Permission denied: [behavior]
- Non-200 dependency response: [behavior]
- Stale action: [behavior]

## 5. Data and Schemas

Define strict TypeScript/Pydantic schemas before business logic.

```ts
// [Schema name]
```

- Preserve prior versions.
- Do not silently overwrite confirmed values.
- Record source, actor and timestamp for review-driven updates.

## 6. Notifications

- Teams event ID: [N-XX or TBD]
- Email: [deep link summary]
- Portal pending state: [queue / entity status]
- Teams action: [action list or none]
- Email action: none in Scope 1

## 7. Audit

Record: [creation], [state changes], [actor], [timestamp], [reason/comment], [previous value], [new value], [notification outcome].

## 8. Acceptance Criteria

- [ ] [Observable behavior]
- [ ] [Permission rule]
- [ ] [Version/history rule]
- [ ] [Notification rule]
- [ ] [Verification command passes]

## 9. Open Questions

- [TBD — preserve until confirmed]
