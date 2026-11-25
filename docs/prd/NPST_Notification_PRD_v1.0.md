# NPST Sales Workflow — Notification PRD v1.0

**Companion to:** `NPST_Sales_Workflow_PRD_v1.0_Pre_Final.md` (3 Nov 2026)  
**Document type:** Standalone notification PRD (derivative/update of main PRD Section 9)  
**Date:** 16 Nov 2026  
**Status:** Draft — view/plan derivative; no main PRD scope changes  
**Scope focus:** Sales, Pre-Sales/Solution, P&L Head

---

## 1. Purpose

Define notification, pending-request, and cross-team communication behavior for the DealPlus workflow. This document expands main PRD Section 9 and operationalizes Q13 (notification channels/recipients/reminder rules).

Cross-team coordination is provided through Microsoft Teams integration (Microsoft 365 identity/authentication). Email is sent in parallel as notification + deep link. Portal pending queues/dashboards/entity status remain the system work state and source of truth; this PRD does not introduce a separate in-app notification feed.

---

## 2. Scope and Release Boundaries

Main PRD scope boundaries remain unchanged.

| Release | Notification scope |
|---|---|
| **Scope 1 — Portal foundation** | Notifications for lead approval, RFP synopsis handoff, proposal/Sales recommendation and P&L decision flow, task/review/deliverable assignment, deal-team assignment, reassignment, and pending resolution. Channels: Microsoft Teams + email. Teams supports actionable decisions defined in this document. |
| **Scope 2** | Compliance review notifications, RFP technical ownership/assignment notifications, RFP extraction/amendment notifications, and broader Teams/email communication efficiency, data reuse, sync, consent, permissions, and source-of-truth behavior defined in main PRD Scope 2. |
| **Later / Out of Scope 1** | Pre-PO/PoC evaluation notifications (demo-only in pushkar), CXO Special Handling notifications, post-PO/EMD notifications, TAT-based reminders/escalation hierarchy, email-initiated state-changing actions, SMS/WhatsApp, and two-way sync beyond defined Teams reply/action handling. |

**Boundary rule:** Actionable Teams delivery for Scope 1 approval/decision events is Scope 1 notification behavior. It does not imply Scope 2 assisted data capture, Teams conversation reuse, or source synchronization.

---

## 3. Roles and Recipients

| Role | Notification responsibility |
|---|---|
| Sales Representative / Sales owner | Receives lead decisions, synopsis return/acceptance, proposal-ready notice, P&L decisions, and assignment notifications relevant to owned records. Submits lead/synopsis/recommendation requests. |
| Pre-Sales / Solution | Receives synopsis submissions, review/task/deliverable/deal-team assignments, and P&L decisions where involved. Accepts/returns synopsis and marks proposal ready as applicable. |
| P&L Head | Receives lead approval requests and Sales recommendation requests. Records approve/send back/reject/proceed/reject decisions. |

**Demo alignment:** pushkar demo uses one P&L Head actor for lead approval and P&L decisions; no separate Sales Head notification path is required in Scope 1.

Recipients are resolved from portal ownership/assignment and mapped to Microsoft 365 UPN/email. Hard-coded employee names must not be used in production configuration.

---

## 4. Channel Policy

| Channel | Scope 1 behavior |
|---|---|
| **Microsoft Teams** | Primary collaboration channel. Every Scope 1 notification event sends a Teams message (chat message and/or activity feed with Adaptive Card) to mapped recipient(s). Decision events include actionable controls. Replies/actions are captured against the notification event. |
| **Email** | Sent for every Scope 1 notification event in parallel with Teams. Email contains event summary, actor, entity context, and deep link to portal/Teams context. Email is notification + link only; no state-changing email action in Scope 1. |
| **Portal work state** | Pending queues, dashboards, entity detail/status, and audit history remain the authoritative pending/work view. No duplicate in-app notification center/feed. |

**Delivery principle:** If one channel fails, the other is still attempted. Channel failure must not block the underlying workflow state transition that is otherwise valid.

---

## 5. Scope 1 Event Catalog

All decision actions listed below are actionable from Teams (Adaptive Card) and may also be completed in portal. Email provides notification/link only.

| ID | Event | Trigger | From | To | Channels | Pending behavior | Teams action |
|---|---|---|---|---|---|---|---|
| N-01 | Lead approval requested | Sales submits lead for approval | Sales | P&L Head | Teams + Email | Create/open pending in P&L lead queue | Approve / Send back for more work / Reject |
| N-02 | Lead approved | P&L approves lead | P&L Head | Sales owner | Teams + Email | Close pending; lead becomes Qualified per flow | Open lead |
| N-03 | Lead sent back for more work | P&L requests rework | P&L Head | Sales owner | Teams + Email | Close pending; lead returns to Working/rework state | Open lead |
| N-04 | Lead rejected | P&L rejects lead | P&L Head | Sales owner | Teams + Email | Close pending; lead moves to Unqualified/rejected state per flow | Open lead |
| N-05 | RFP synopsis submitted | Sales submits synopsis to Pre-Sales | Sales | Pre-Sales owner/queue | Teams + Email | Create/open pending in Pre-Sales synopsis queue | Accept / Return to Sales |
| N-06 | RFP synopsis returned | Pre-Sales returns synopsis | Pre-Sales | Sales owner | Teams + Email | Close pending; synopsis returned state | Open synopsis |
| N-07 | RFP synopsis accepted | Pre-Sales accepts synopsis | Pre-Sales | Sales owner + assigned Pre-Sales | Teams + Email | Close pending; lead converted and opportunity created per flow | Open opportunity/synopsis |
| N-08 | Proposal ready for Sales synopsis/recommendation | Pre-Sales marks proposal ready (or equivalent) | Pre-Sales | Sales owner | Teams + Email | Create/open pending on Sales | Open opportunity / write recommendation |
| N-09 | Sales recommendation submitted | Sales submits Yes/No recommendation and synopsis | Sales | P&L Head | Teams + Email | Create/open pending in P&L decisions queue | Proceed / Reject |
| N-10 | P&L decision recorded | P&L records Proceed or Reject | P&L Head | Sales owner + involved Pre-Sales | Teams + Email | Close pending; update opportunity/decision state | Open opportunity/decision |
| N-11 | Review assigned | Document/review assigned | Requester | Reviewer | Teams + Email | Create/open pending for reviewer | Open review / acknowledge in portal |
| N-12 | Task assigned | Task assigned on opportunity/entity | Requester | Assignee | Teams + Email | Create/open pending for assignee | Open task |
| N-13 | Deliverable assigned | Deliverable assigned | Requester | Assignee | Teams + Email | Create/open pending for assignee | Open deliverable |
| N-14 | Deal team member added | Person added to deal team | Requester | Added person | Teams + Email | Informational (no approval pending unless separately assigned) | Open opportunity |

**Scope-tagged out of Scope 1:** compliance review requests/matrix notifications, RFP technical ownership/assignment notifications, RFP extraction/amendment notifications, Pre-PO/PoC evaluation notifications, CXO notifications, post-PO/EMD notifications, reminders/escalation.

---

## 6. Pending Request Model

Pending requests represent actionable work state, not a separate inbox.

| Rule | Requirement |
|---|---|
| Creation | Decision/assignment events (N-01, N-05, N-08, N-09, N-11, N-12, N-13) create or update a pending request for the target assignee/role. |
| Uniqueness | At most one open pending request per `entity_id + event_type + assignee` (or assignee role where individual assignment is not yet resolved). |
| Resubmission | Repeated submit updates the existing open pending request (timestamp/comment/context) and must not create duplicate pending records or duplicate channel deliveries for unchanged state. |
| Resolution | Valid action closes the pending request, records resolver/actor, timestamp, action, and comment/reason, and triggers resolution notification(s). |
| Reassignment | Reassignment closes/transfers the prior pending assignment as configured, creates or updates pending for the new assignee, and notifies the new assignee. |
| Visibility | Pending state must be visible in relevant portal queue/dashboard/entity view for authorized users. |
| Comments | Reject, Send back/Rework, and Return actions require a comment/reason. |
| Idempotency/conflict | First valid action wins. Subsequent or stale actions must not change state and must return “already actioned by \<actor\> at \<time\>.” |
| Closure | No auto-approval, no auto-reject, no silent closure. |
| Reminders | Reminder frequency, due-date nudges, and TAT escalation are out of Scope 1. |

**Minimum pending fields:** request id, notification event id, event type, entity type/id, requester, assignee/role, status (`open`, `resolved`, `superseded`, `cancelled`), created/updated timestamps, due date (if applicable), resolution action, resolver, resolved timestamp, comment.

---

## 7. Microsoft Teams Integration

### 7.1 Identity and mapping

- Users authenticate via Microsoft 365 identity.
- Portal users are mapped to Teams recipients via M365 UPN/email/object identity.
- Unmapped recipients: record mapping failure, surface in admin/operational log, and do not block workflow; email delivery still attempted.

### 7.2 Outbound (Scope 1)

- Use Microsoft Graph API (and bot framework where required for actionable cards/callbacks).
- Delivery types: chat message and/or activity feed notification with Adaptive Card.
- Card/message content: event type, entity name/id, account/client context (minimum necessary), requester, due/context, summary, action buttons (where applicable), deep link, event/request id, timestamp.
- No sensitive attachments in Teams/email payload; documents remain in portal with existing access controls.

### 7.3 Inbound actionable replies (Scope 1)

- Supported actions: `Approve`, `Send back for more work`, `Reject`, `Accept`, `Return`, `Proceed`, `Reject` (P&L), as mapped by event type.
- Action callback must include signed/validated token, event/request id, actor identity, action, and comment where required.
- Server validates: token integrity/expiry, M365 identity mapping, portal role/permission, entity state, and pending-request status before applying action.
- Applied action updates portal workflow state, closes pending request, writes audit record, and sends resolution notifications.
- Unauthorized, expired, duplicate, or stale actions are rejected with no workflow/state change.

### 7.4 Delivery, retry, and audit

| Concern | Requirement |
|---|---|
| Delivery states | `queued`, `sent`, `delivered` (where provider confirms), `failed`, `action_received` (for actionable events). |
| Retry | Automatic retry with backoff for transient failures; configurable retry limit. |
| Idempotency | Idempotency key = notification event/delivery id; prevent duplicate provider sends for same logical delivery attempt. |
| Fallback | Teams failure does not block email delivery or workflow progression; portal pending state remains authoritative. |
| Audit | Record event creation, recipient mapping, send attempts, provider response/id, delivery status, action callback, validation result, applied/rejected action, actor, and timestamps. |

---

## 8. Email Integration

- Email is sent for every Scope 1 notification event in parallel with Teams.
- Email payload includes event summary, actor, entity reference, required context, pending/action status, and deep link to portal (and Teams context where useful).
- Email is notification + link only in Scope 1. No approve/reject/proceed/return actions are executed from email reply.
- Email delivery uses the same event id, dedupe rules, retry/backoff, and audit model as Teams deliveries.
- Parallel delivery is intentional per this PRD decision; suppression/preferences may be considered later.

---

## 9. Data Model and Audit

| Entity | Key fields (minimum) |
|---|---|
| `notification_event` | id, event_type, scope (`S1`), entity_type, entity_id, actor_id, actor_role, payload_summary, deep_link, created_at |
| `pending_request` | id, event_id, entity_type, entity_id, assignee_id/role, status, due_at, comment_required, created_at, updated_at, resolved_at, resolved_by, resolution_action, resolution_comment |
| `notification_delivery` | id, event_id, channel (`teams`,`email`), recipient_id, recipient_address, status, provider_message_id, attempt_count, sent_at, delivered_at, failed_at, error_code/message |
| `teams_action` | id, event_id, pending_request_id, token_id, teams_actor_id, portal_actor_id, action, comment, validation_status, applied, received_at, processed_at |
| `notification_audit` | id, event_id, entity_type, entity_id, event_name, channel, actor, target, outcome, details, timestamp |

**Audit requirements:** Preserve immutable history of notification events, deliveries, pending state changes, Teams actions, failures, and resolutions. Apply existing role/document/entity permissions server-side.

---

## 10. Acceptance Criteria

1. Every Scope 1 event in Section 5 creates a notification event and attempts Teams + email delivery per policy.
2. Each actionable event creates/updates exactly one open pending request per entity/event/assignee.
3. Repeated submission does not create duplicate open pending requests or duplicate channel deliveries for unchanged state.
4. Authorized Teams actions update portal state, close pending request, and generate resolution notification(s).
5. Unauthorized, expired, duplicate, or stale Teams actions do not change workflow state and return a clear conflict/result.
6. Reject/Send back/Return actions require comment and preserve it in pending/audit records.
7. Email contains notification + deep link only; no email reply performs workflow action in Scope 1.
8. Delivery failure on one channel does not block the other channel or valid workflow progression.
9. Pending/work state remains visible in portal queues/dashboards/entity views; no separate in-app notification center is required.
10. All notification sends, deliveries, failures, actions, and resolutions are auditable.
11. Scope 2/later events are not enabled as Scope 1 notifications.

---

## 11. Demo Gap List (pushkar / dealplus-demo-v11)

| Area | Demo behavior | Gap vs this PRD |
|---|---|---|
| Teams delivery | Simulated Teams messages/toasts stored in local state | No Microsoft Graph integration, no real delivery status, no retry/backoff |
| Email delivery | Not implemented | No parallel email channel |
| Actionable replies | Not implemented | No Teams Adaptive Card actions or bot callback; actions done in portal only |
| Event coverage | Lead approval request/decision and synopsis accepted send Teams messages; tasks/reviews/deliverables/deal-team/compliance assignments send Teams messages | Missing Teams/email on synopsis submit, synopsis return, proposal ready, recommendation submitted, P&L decision recorded |
| Pending state | Queues and entity status exist (lead approval, synopsis, decisions) | No unified pending-request record model, idempotency rules, reassignment handling, or stale-action handling |
| Audit | UI/history entries exist for some actions | No notification/delivery/action audit trail |
| Scope tagging | Compliance, Pre-PO/PoC, Post-PO present in demo | Compliance is Scope 2 in main PRD; Pre-PO/PoC/Post-PO notifications are demo/later for this notification scope |

---

## 12. Traceability

| Reference | Link |
|---|---|
| Main PRD Section 3, Scope 1 | “Basic action/review notifications, subject to confirmed rules.” |
| Main PRD Section 9 | Notifications baseline expanded by this companion PRD |
| Main PRD Section 10 | Audit/data integrity extended to notification events, deliveries, pending requests, and Teams actions |
| Main PRD Q13 | Channels, recipients, reminder rules — partially defined here; reminder frequency/TAT escalation remain out of Scope 1 |
| pushkar demo | `dealplus-demo-v11/src/components/Teams.jsx`, `src/store/Store.jsx`, `src/pages/LeadDetail.jsx`, `src/pages/RfpSynopsis.jsx`, `src/pages/Decisions.jsx`, `src/pages/Opportunity.jsx`, `src/pages/Compliance.jsx`, `src/pages/Dashboard.jsx` |

**Pre-final note:** This companion defines Scope 1 notification behavior consistent with current demo flow and main PRD scope boundaries. Open items inherited from main PRD (P&L gate model, state model, conversion trigger, CXO placement, Scope 2 details) remain governed by the main PRD decision register. Notification event IDs and pending rules must be aligned to final gate/state decisions before approval.