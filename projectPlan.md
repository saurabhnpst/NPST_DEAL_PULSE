# DealPlus Starter Kit — Project Plan Context

**Date:** 20 Nov 2026  
**Status:** Starter kit scaffold complete  
**Scope:** Documentation, coding rules, local verification and repo hygiene

## 1. Project context

DealPlus is an in-house NPST portal for sales opportunity workflow and visibility through **PO receipt**. It gives Sales, Pre-Sales/Solution, P&L Heads, reviewers and leadership a shared, role-appropriate view of leads, opportunities, proposals, commercial history and decisions.

Key boundaries from the PRDs:

- **Scope 1 ends at PO receipt.** It covers lead capture and evaluation, Sales synopsis, P&L Lead review, Opportunity Evaluation, lead conversion, opportunity workflow, Sales-to-Pre-Sales/Solution handoff, proposal versions, Sales recommendation, P&L Head decision, commercial revision history, outcome and PO receipt.
- **Scope 2** covers assisted data capture, Teams/email data reuse, RFP/tender extraction, amendment review, compliance seeding, compliance evidence review and RFP technical ownership/assignment.
- **Later/out of Scope 1:** PO validation/acceptance/decline, post-PO work, OpenProject integration, TAT escalation, transcript auto-capture, automated bid/no-bid, pricing generation, proposal generation and P&L automation.
- **CXO Special Handling** is a linked governance track on an existing opportunity, not a separate pipeline. Release placement and approval policy remain TBD.
- Portal pending queues, dashboards, entity status and audit history are the system of work. There is no separate in-app notification feed.
- Scope 1 notifications send **Microsoft Teams + email in parallel**. Teams handles actionable decisions with signed callbacks. Email is notification plus deep link only.
- PRD TBDs must remain TBD. No final approvers, routing rules, stages, thresholds, folders or SLAs were invented.

Current stack:

- Frontend: Vite + React 18, currently JSX, incremental TypeScript migration.
- Backend: NestJS 10 TypeScript monorepo, API Gateway plus 11 services.
- Local infrastructure: MySQL 8.4, RabbitMQ, Redis and MinIO.
- Identity/notifications: Microsoft 365 identity, Microsoft Graph/Teams cards and parallel email.

## 2. What was written and why

| File / area | Why written |
|---|---|
| `AGENTS.md` | Gives every agent the repo operating model: stack, verification commands, no-CI rule, workflow boundaries, notification behavior, RFP/compliance controls, server-side permissions, audit and no silent overwrite. This replaces the earlier generic instructions with DealPlus-specific rules. |
| `.cursor/rules/00-core.mdc` | Global guardrails: inspect before edit, ask plan for multi-file work, no auth/billing/schema edits without authorization, strict schemas first, no `any`, preserve TBDs and history. |
| `.cursor/rules/10-typescript.mdc` | Glob-loaded for TS/TSX. Enforces strict types, `unknown` narrowing, schema-first DTOs and no drive-by JSX conversion. Sources workflow unions from `docs/workflow-states.md`. |
| `.cursor/rules/20-nestjs.mdc` | Glob-loaded for backend TS. Keeps handlers thin, service databases isolated, events idempotent and permissions sourced from `docs/permission-matrix.md`. |
| `.cursor/rules/30-react-vite.mdc` | Glob-loaded for frontend source. Keeps current JSX stable, requires `.ts`/`.tsx` for new files and treats portal state as authoritative. |
| `.cursor/rules/40-security-permissions.mdc` | Agent-requested. Points to `docs/permission-matrix.md`; denies by default and blocks hardcoded people, sensitive payloads and unaudited access. |
| `.cursor/rules/50-workflow-scope.mdc` | Agent-requested. Short rule pointing to `docs/workflow-states.md` and `docs/TBD-register.md`; preserves Scope 1/2 boundaries, PO boundary, product options and commercial formula. |
| `.cursor/rules/60-notifications.mdc` | Glob-loaded for notification-related code. Points to `docs/notification-matrix.md`; adds signed-callback security, pending uniqueness, first-valid-action-wins and channel-failure rules. |
| `.cursor/rules/70-rfp-compliance.mdc` | Glob-loaded for RFP/assignment/compliance areas. Short rule covering drafts, evidence, versions, configurable ownership and advisory compliance. |
| `.cursor/rules/80-testing.mdc` | Glob-loaded for tests, package scripts and hooks. States local verification commands and flags `--passWithNoTests` as compile-only. |
| `.cursor/rules/90-docs.mdc` | Glob-loaded for docs. Keeps PRD-aligned docs, scope tags, TBD preservation and manual release language. |
| `docs/TBD-register.md` | Condensed open-question register with IDs and validation-owner roles. Rule: stop and ask when a task touches a TBD. |
| `docs/permission-matrix.md` | Role × entity × action baseline with server-side check list and conflict responses. Prevents permission guessing. |
| `docs/workflow-states.md` | Candidate lead, opportunity, proposal and PO state machines with allowed transitions and TBD markers. |
| `docs/notification-matrix.md` | N-01 to N-14 in one table: trigger, recipients, pending behavior, Teams action and comment requirement. |
| `docs/templates/prd.md` | Standard PRD structure with scope, users, workflow, schemas, notifications, audit, acceptance criteria and open questions. |
| `docs/templates/feature-spec.md` | Feature-level spec covering states, permissions, schemas, data integrity, notification behavior, acceptance and verification. |
| `docs/templates/implementation-plan.md` | Multi-file plan format with explicit constraints, file impact, risks, verification and manual rollback. |
| `docs/templates/adr.md` | Decision-record template preserving context, options, consequences and validation owner. |
| `docs/templates/api-contract.md` | Strict endpoint contract with request/response schemas, permission checks, error matrix, idempotency, events and audit. |
| `docs/templates/event-contract.md` | Versioned event envelope template with payload, privacy, retry, idempotent consumers and dead-letter expectations. |
| `docs/templates/notification-event.md` | Per-event template for N-XX events: channels, pending model, Teams action validation, email limitation, delivery states and audit. |
| `docs/templates/test-plan.md` | Test matrix for happy path, permission denial, duplicates, stale actions, missing comments, channel failure, non-200 responses and data integrity. |
| `docs/templates/runbook.md` | Local operations guide with startup, health check, common failures, notification checks and manual recovery. |
| `docs/templates/release-checklist.md` | Manual release checklist covering scope, permissions, verification, Scope 2 checks, notification checks, docs and post-release review. Explicitly no CI/CD. |
| `package.json` | Root scripts for Husky and local verification: `prepare`, `verify`, `verify:frontend`, `verify:backend`. Adds `husky` as the only root dev dependency. |
| `package-lock.json` | Lockfile generated for root Husky dependency. |
| `.husky/pre-commit` | Local git hook running `npm run verify`. Hooks remain local-only, not CI. |
| `.env.example` | Safe placeholder environment values for local MySQL, RabbitMQ, MinIO, JWT secrets and Microsoft 365/Teams/email settings. No real credentials. |
| `.gitignore` | Prevents committing `node_modules`, build output, coverage, logs, OS files and real `.env` files while allowing `.env.example`. |
| `frontend/`, `backend/` | `frontend` unchanged; `backend` contains the approval-service mock implementation, tests, strict spec typecheck config and Jest config. `frontend/package-lock.json` restored to the committed version; generated `backend/package-lock.json` and local `node_modules` removed to match the team standard. |

## 3. Deliberately not written

- No `.github/workflows`, CI YAML, pipeline config or deployment automation.
- No auth, billing or database schema code.
- No hardcoded employees, managers, approvers, reviewers, Tech Leads or thresholds.
- No separate in-app notification feed.
- No new lint tooling, because current frontend/backend have no lint script.
- No invented PRD decisions; all unresolved product rules stay TBD.

## 4. Verification completed

Verification ran after temporary dependency install:

```bash
npm install
npm --prefix frontend install
npm --prefix backend install
npm run verify
```

Frontend/backend install artifacts were restored. Backend approval-service source, strict typecheck config and tests remain.

`npm run verify` passed with:

- Frontend build: passed.
- Backend build: passed.
- Backend strict typecheck: passed.
- Backend test: passed with `--passWithNoTests` (29 tests).
- Husky hook path configured to `.husky/_`; `.husky/pre-commit` is executable.

npm reported audit warnings from existing dependency versions. No automatic audit fixes were applied.

## 5. How this supports the PRDs

The starter kit converts the two PRDs into working rules for future implementation:

- Main PRD controls product scope and workflow boundaries.
- Notification PRD v1.0 controls Scope 1 event behavior, pending requests and Teams/email delivery.
- Rules prevent agents from bypassing gates, fabricating extracted values, overwriting confirmed data or expanding Scope 1.
- Templates give future work a consistent path from PRD → feature spec → schema → API/event contract → tests → manual release checklist.
- Local Husky verification provides quality checks without introducing CI/CD.

## 6. Suggested next steps

1. Review `.cursor/rules`, `AGENTS.md` and the four condensed docs with product/tech owners.
2. Resolve TBDs with the listed validation-owner roles before workflow or permission work.
3. Add the shared contracts package with Zod schemas and versioned event envelopes, then write API/event contracts.
4. Build one thin vertical slice: lead submit → P&L review → N-01/N-02 notification → audit entry. Add tests for permission, idempotency, stale action and channel failure.
5. Watch where agents ignore or misread rules; prune or rewrite those rules before scaling to all 11 services.
6. Follow-up hardening: linter, `tsc --noEmit`, real minimum tests, `gitleaks`, `.cursorignore`, `/plan`, `/review`, `/spec-to-contract`, service map, `PLAN.md` and `DECISIONS.md`.
