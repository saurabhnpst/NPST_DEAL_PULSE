# DealPlus permission matrix

**Status:** Baseline from PRD. Unknown detail stays TBD.  
**Rule:** Enforce server-side. Role alone is never enough; also check team, territory, product vertical, ownership, assigned task and document permission. Deny by default.

**Action codes:** C = create, R = read scoped, U = update scoped, S = submit/recommend, D = decide, A = assign/reassign, K = confirm/approve/close.

| Role | Lead | Opportunity | Handoff / synopsis | Proposal | Commercial | PO receipt | RFP draft | Compliance | Assignment | Approval / decision | CXO track | Dashboards |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Sales Representative | C R U S | C R U | C R S | R | C R U | C R U | R U/K if authorized | R | R | C R S | R if owner; actions TBD | R own scope |
| Sales Head | R U A | R U A | R | R | R | R | R | R | R | R; decisions TBD | R | R team/territory |
| Pre-Sales / Solution | R where involved | R where involved | R U A Accept/Return | C R U | R | R | R U/K if authorized | C R U | R | R where involved | R if assigned; action TBD | R assigned scope |
| P&L Head | R D lead gate | R | R | R | R | R | R if authorized | R | R | R D | R if assigned | R product scope |
| Partnerships | C R U partner-related | R U partner-related | R | R | R | R | R if involved | R | R | R | R if involved | R partner scope |
| Finance / Legal / Compliance reviewer | R assigned only | R assigned only | R assigned only | R assigned only | R assigned only | R assigned only | R assigned only | R U K assigned | R assigned only | R assigned only | R assigned only | R assigned scope |
| CXO / Senior Leadership | R allowed scope | R allowed scope | R | R | R | R | R if authorized | R | R | R | R default; assigned actions only | R allowed scope |
| Admin / Business Ops | Config only | Config only | Config only | Config only | Config only | Config only | Config only | Config only | Config only | Config only | Config only | Config + audit R |

## Required server checks

- Requester identity from M365 mapping.
- Role and configured permission.
- Team, territory and product vertical scope.
- Ownership or contributor involvement.
- Assigned-task scope for Finance/Legal/Compliance/SME actions.
- Document-level permission for RFP, proposal, evidence and PO files.
- Entity state allows the action.
- Pending request is open and actor is target assignee/role.

## Conflict handling

- Permission failure: `403`.
- Not visible or not found: `404` where hiding existence is required.
- Stale/duplicate action: `409`, first valid action wins.
- No hardcoded employee names, reporting lines, approvers or Tech Leads.
- If this matrix does not cover an action, stop and ask.
