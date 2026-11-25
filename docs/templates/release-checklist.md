# Manual Release Checklist — [Version]

**Date:** [TBD]  
**Release owner:** [Role, not person]  
**Scope included:** [Scope 1 / Scope 2 items]  
**Status:** [Draft / Ready / Complete]

No CI/CD in this org. Use manual checks only. Do not add `.github/workflows`, CI YAML, pipeline config or deployment automation.

## Pre-release

- [ ] PRD TBDs reviewed; no invented values added
- [ ] Scope boundaries confirmed
- [ ] Permission matrix reviewed server-side
- [ ] Role/team/territory/product/ownership/task/document checks tested
- [ ] No hardcoded employee names, approvers, reviewers or Tech Leads
- [ ] Auth/billing/schema changes explicitly authorized or absent
- [ ] Migrations reviewed by service owner
- [ ] Secrets absent from source, logs and docs

## Functional Verification

- [ ] `npm --prefix frontend run build`
- [ ] `npm --prefix backend run build`
- [ ] `npm --prefix backend test -- --passWithNoTests`
- [ ] Lead and opportunity gates walkthrough
- [ ] Handoff/proposal/recommendation/P&L decision walkthrough
- [ ] Commercial history preservation checked
- [ ] PO receipt boundary checked; no PO validation/acceptance/decline

## Scope 2 Checks if Included

- [ ] RFP drafts show source evidence
- [ ] No field populated before confirmation
- [ ] Amendments versioned and reviewed
- [ ] Extraction failure allows manual flow
- [ ] Compliance suggestions advisory
- [ ] SME review history preserved
- [ ] Tech Lead assignments pending until Solution Manager approval
- [ ] Unmapped requirements routed without auto-assignment

## Notification Checks

- [ ] Teams and email sent in parallel
- [ ] Portal queues/dashboards remain source of truth
- [ ] No separate in-app notification feed
- [ ] Pending uniqueness verified
- [ ] Reject/Send back/Return comments required
- [ ] Stale/duplicate Teams actions rejected
- [ ] Email has no workflow action

## Documentation

- [ ] API contracts updated
- [ ] Event contracts updated
- [ ] ADRs updated
- [ ] Runbook updated
- [ ] Test plan results attached

## Post-release

- [ ] Manual smoke check
- [ ] Audit logs reviewed
- [ ] Open questions recorded
- [ ] Rollback notes confirmed
