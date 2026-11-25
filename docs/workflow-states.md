# DealPlus workflow states

**Status:** Candidate state model from PRDs. Exact labels and transitions remain TBD where marked.  
**Rule:** Use `docs/TBD-register.md` before changing states. Do not silently replace source-defined stages.

## Lead

Source lead status labels: **New, Nurturing, Cold/Unqualified, Qualified**. Exact transitions: TBD-01, TBD-55.

| From | Action / gate | To | Notes |
|---|---|---|---|
| New | capture and assign owner | New / Nurturing | Lead owner and source recorded |
| New / Nurturing | Sales evaluation | Synopsis submitted | Yes/No recommendation; No requires reason |
| Synopsis submitted | submit to P&L Lead | P&L Lead review pending | N-01 |
| P&L Lead review pending | Proceed | Opportunity Evaluation | N-02 |
| P&L Lead review pending | Send back / Pending clarification | Rework pending | N-03; comment required |
| P&L Lead review pending | Reject | Rejected / Unqualified | N-04; comment required |
| Synopsis submitted | No recommendation | Not recommended | Reason required |
| Opportunity Evaluation | Proceed | Conversion | Create/link Account, Contact, Opportunity |
| Opportunity Evaluation | Do not proceed | Evaluation rejected | Reason retained |
| Conversion | complete | Opportunity created | Reuse matching records; no duplicates |

## Opportunity

Source-defined stage list and probability mapping: TBD-02, TBD-56, TBD-57.

| From | Action | To | Notes |
|---|---|---|---|
| Qualification | progress | Needs Analysis | Stage fields conditional |
| Needs Analysis | progress | Impact Analysis | Preserve Impact Analysis; reconcile before finalizing |
| Impact Analysis | progress | Proposal | RFP/compliance work may be active |
| Proposal | progress | Negotiation | Commercial revisions tracked |
| Negotiation | record outcome | Closed Won / Closed Lost / No Bid / On Hold | Outcome fields required per PRD |
| On Hold | resume | prior stage or agreed stage | Resume rule TBD |
| Closed Won | PO received | PO Received | Distinct from Closed Won |
| Closed Won | no PO yet | Closed Won without PO | PO receipt outstanding |

## Proposal

| From | Action | To | Notes |
|---|---|---|---|
| Draft | internal review | Internal Review | Version retained |
| Internal Review | changes requested | Revision | Preserve prior version |
| Revision | ready | Ready for Sales | N-08 |
| Ready for Sales | Sales review | Sales Recommendation Submitted | Yes/No + synopsis |
| Sales Recommendation Submitted | submit | P&L Decision Pending | N-09 |
| P&L Decision Pending | Proceed | Proceeded | N-10; negotiation continues |
| P&L Decision Pending | Reject | Rejected | N-10; reason/comment; outcome updated |
| P&L Decision Pending | clarification | Pending / clarification | Allowed behavior TBD-05 |

## PO receipt

Scope 1 records receipt only. No validation, acceptance or decline. Multiple POs: TBD-11.

| From | Action | To | Notes |
|---|---|---|---|
| Closed Won | record PO receipt date/document/details | PO Received | Attach/link PO; no validation |
| PO Received | compare commercial data | variance view where data exists | PO values may differ |

## Cross-track rules

- CXO Special Handling links to an existing opportunity; no separate pipeline. Placement and approval policy remain TBD.
- Commercial revisions never overwrite initial or prior values.
- Draft RFP/compliance values never update confirmed fields without review.
- No auto-approval, auto-reject or silent closure.
