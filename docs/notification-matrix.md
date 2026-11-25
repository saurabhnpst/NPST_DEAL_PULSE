# DealPlus notification matrix

**Status:** Scope 1 baseline from Notification PRD v1.0. Final gate/state alignment remains TBD.  
**Channels:** Every row sends Microsoft Teams + email in parallel. Portal queues/entity status remain source of truth. Email has no state-changing action.

| ID | Trigger | From → To | Pending behavior | Teams action | Comment required |
|---|---|---|---|---|---|
| N-01 | Sales submits lead for approval | Sales → P&L Head | Create/open pending in P&L lead queue | Approve / Send back for more work / Reject | Send back, Reject |
| N-02 | P&L approves lead | P&L Head → Sales owner | Close pending; lead becomes Qualified per flow | Open lead | No |
| N-03 | P&L requests rework | P&L Head → Sales owner | Close pending; lead returns to rework | Open lead | Yes |
| N-04 | P&L rejects lead | P&L Head → Sales owner | Close pending; lead rejected per flow | Open lead | Yes |
| N-05 | Sales submits RFP synopsis to Pre-Sales | Sales → Pre-Sales owner/queue | Create/open pending in Pre-Sales synopsis queue | Accept / Return to Sales | Return |
| N-06 | Pre-Sales returns synopsis | Pre-Sales → Sales owner | Close pending; synopsis returned | Open synopsis | Yes |
| N-07 | Pre-Sales accepts synopsis | Pre-Sales → Sales + assigned Pre-Sales | Close pending; conversion/opportunity per flow | Open opportunity/synopsis | No |
| N-08 | Proposal marked ready | Pre-Sales → Sales owner | Create/open pending on Sales | Open opportunity / write recommendation | No |
| N-09 | Sales submits Yes/No recommendation and synopsis | Sales → P&L Head | Create/open pending in P&L decisions queue | Proceed / Reject | Reject |
| N-10 | P&L records Proceed or Reject | P&L Head → Sales + involved Pre-Sales | Close pending; update decision state | Open opportunity/decision | Reject reason |
| N-11 | Document/review assigned | Requester → Reviewer | Create/open pending for reviewer | Open review / acknowledge in portal | No |
| N-12 | Task assigned | Requester → Assignee | Create/open pending for assignee | Open task | No |
| N-13 | Deliverable assigned | Requester → Assignee | Create/open pending for assignee | Open deliverable | No |
| N-14 | Deal team member added | Requester → Added person | Informational | Open opportunity | No |

## Shared rules

- One open pending request per `entity_id + event_type + assignee`.
- Repeated submit updates existing pending; no duplicate pending or duplicate unchanged channel delivery.
- First valid action wins. Stale, duplicate, expired or unauthorized actions return `409` and change nothing.
- Teams callbacks require signature, expiry, timestamp, nonce replay protection, M365 identity, role, entity-state and pending-state validation.
- Reject, Send back and Return require comments.
- No reminders, due-date nudges, TAT escalation, auto-approval, auto-reject or silent closure in Scope 1.
- Teams failure must not block email or valid workflow progression.
- Audit event creation, recipient mapping, send attempts, provider response, delivery state, callback validation and applied/rejected action.

## Not Scope 1

Compliance review, RFP technical ownership, RFP extraction/amendment, Pre-PO/PoC, CXO, post-PO/EMD and TAT notifications.
