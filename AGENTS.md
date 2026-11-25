# DealPlus agent instructions

## Core Directives

- ALWAYS inspect relevant files before modifying them.
- Ask for a plan before implementing any multi-file feature.
- NEVER modify authentication, billing, or database schema files without explicit authorization.
- Write strict TypeScript/Pydantic schemas first before writing business logic.
- No CI/CD in this org. Do not create `.github/workflows`, CI YAML, pipeline config, or deployment automation unless explicitly requested.
- Keep Portal pending queues, dashboards, entity status, and audit history as the system of work. Do not add a separate in-app notification feed.
- Preserve PRD TBDs. Do not invent final approvers, routing rules, stages, thresholds, folders, or SLAs.
- Do not hardcode employee names, reporting relationships, approvers, reviewers, or Tech Leads.
- Enforce role, team, territory, product vertical, ownership, assigned-task, and document permissions server-side.
- Never silently overwrite confirmed business data. Preserve versions and audit history.

## Stack

- Frontend: Vite + React 18, currently JSX, incremental TypeScript migration; `frontend/package.json`.
- Backend: NestJS 10 TypeScript monorepo with API Gateway plus 11 services; `backend/package.json`, `docs/architecture/microservices.md`.
- Local infrastructure: MySQL 8.4, RabbitMQ, Redis, MinIO; `docker-compose.yml`.
- Identity/notifications: Microsoft 365 identity, Microsoft Graph/Teams actionable cards, parallel email notification.
- Persistence ownership: one database/schema per service; no cross-service database joins or direct writes; `docs/database/ownership.md`.

## Commands to Verify Changes

- Full local verify: `npm run verify` from repository root.
- Frontend build: `npm --prefix frontend run build`.
- Backend build: `npm --prefix backend run build`.
- Backend test: `npm --prefix backend test -- --passWithNoTests`.
- Lint: no repository lint script exists. Do not call `npm run lint` or add lint tooling without explicit setup.
- Husky: `.husky/pre-commit` runs `npm run verify`. Hooks are local-only, not CI.

## Code Style Invariants

- Use explicit types; no `any`.
- Prefer `unknown` with narrowing at external boundaries.
- Keep functions under 40 lines.
- Handle all edge cases, empty states, missing values, and non-200 API responses explicitly.
- New frontend source files should be `.ts`/`.tsx` unless extending existing JSX has a clear reason.
- Keep controllers/handlers thin; put validation, authorization, and domain rules in dedicated modules.
- Use schema-first DTOs and versioned event envelopes.
- Event consumers must be idempotent.
- Do not expose secrets, tokens, document bodies, or sensitive commercial data in logs or error payloads.

## Workflow Boundaries

- Scope 1 ends at PO receipt.
- Scope 1: lead capture and evaluation, Sales synopsis, P&L Lead review, Opportunity Evaluation, lead conversion, opportunity workflow, Sales/Pre-Sales handoff, proposal, Sales recommendation, P&L Head decision, commercial revisions, outcome, PO receipt.
- Scope 2: assisted data capture, RFP/tender extraction, amendment review, compliance seeding, RFP technical ownership, Teams/email data reuse.
- Out of Scope 1: PO validation/acceptance/decline, post-PO work, OpenProject integration, TAT escalation, transcript auto-capture, automated bid/no-bid, pricing generation, proposal generation, P&L automation.
- CXO Special Handling is a linked governance track on an existing opportunity, not a separate pipeline. Release placement and approval policy remain TBD.
- Closed Won and PO Received are distinct.
- `Total Deal Size First Year = ARR + One Time`; preserve commercial revision history.
- Products/modules: BBPS, UPI, ODR, CBDC, EFRM, ERP. Dependent selections remain TBD.
- Reconcile source-defined opportunity stages with current NPST stages, specifically Impact Analysis. Do not silently replace stages.

## Notifications

- Scope 1 sends Teams and email in parallel.
- Teams handles actionable decisions with signed, validated callbacks.
- Email is notification plus deep link only; no state-changing email actions in Scope 1.
- One open pending request per `entity_id + event_type + assignee`.
- Repeated submit updates existing pending state; no duplicate pending records or duplicate deliveries for unchanged state.
- Reject, Send back for more work, and Return require comments.
- First valid action wins. Stale, duplicate, expired or unauthorized actions must not change workflow state.
- No auto-approval, auto-reject, silent closure, reminders, due-date nudges, or TAT escalation in Scope 1.
- Channel failure must not block the other channel or a valid workflow transition.

## RFP, Assignment and Compliance

- RFP extracted values are drafts with source evidence until authorized confirmation.
- Store amendments as distinct versions; compare with prior versions; preserve prior confirmed values.
- Missing, ambiguous, conflicting or unreadable information is flagged, never fabricated.
- Extraction failure must not block manual processing or Sales-to-Pre-Sales handoff.
- Product to Default Tech Lead mapping must be configurable and authorized; no hardcoded assignments.
- Proposed assignments remain pending until Solution Manager review.
- Unmapped requirements go to Unmapped/Review with no automatic Tech Lead assignment.
- Compliance domains initially UPI, IMPS and BBPS.
- Compliance suggestions are advisory. SMEs validate applicability, status, and evidence.
- Evidence links do not automatically prove compliance.
