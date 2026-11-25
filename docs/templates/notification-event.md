# Notification Event — [N-XX]

**Event ID:** [N-XX]  
**Scope:** [S1]  
**Status:** [Proposed / Approved / Superseded]  
**Source PRD:** Notification PRD v1.0, Section 5

## Event Summary

| Field | Value |
|---|---|
| Name | [event name] |
| Trigger | [trigger] |
| From | [role] |
| To | [role/assignee] |
| Entity | [entity type + id] |
| Portal state | [pending/queue/entity status] |

## Channels

| Channel | Behavior |
|---|---|
| Teams | [Adaptive Card message / activity feed] |
| Email | Notification plus deep link only |

No state-changing email actions in Scope 1.

## Teams Action

- Actions: [Approve / Send back / Reject / Accept / Return / Proceed / None]
- Comment required: [actions]
- Signed callback required: yes
- Validation: token, expiry, M365 identity, portal role, entity state, pending status

## Pending Request

- Create/update: [yes/no]
- Uniqueness: `entity_id + event_type + assignee`
- Repeated submit: update existing pending; no duplicate pending or duplicate unchanged delivery
- Resolution: record resolver, actor, timestamp, action and comment/reason
- Reassignment: [behavior]
- No auto-approval, auto-reject or silent closure

## Payload Safety

- Include event summary, actor, entity context, deep link and request id.
- Do not include attachments, tokens or sensitive commercial details.

## Delivery and Audit

- Delivery states: `queued`, `sent`, `delivered`, `failed`, `action_received`
- Retry transient failures with backoff.
- Channel failure must not block other channel or workflow progression.
- Audit event creation, recipient mapping, attempts, provider response, callbacks, validation and applied/rejected action.

## Acceptance Criteria

- [ ] Teams and email attempted in parallel
- [ ] One open pending per entity/event/assignee
- [ ] Stale/duplicate actions rejected without state change
- [ ] Portal queue remains source of truth
- [ ] Audit complete
