# Frontend mock data removal

Audit and cleanup of the DealPulse React + Vite frontend to remove mock, dummy, and browser-persisted business data and to wire list/detail flows to the API gateway where endpoints exist.

**Date:** 2026-11-25  
**Scope:** `frontend/` only (no backend changes).

## Mock data locations identified

| Location | Type |
|----------|------|
| `src/data/seed.js` | Seed leads, opportunities, synopses, decisions, compliance, evaluations, reviews, post-PO tables, `TEAM` / `PRESALES` rosters |
| `src/data/oppExtras.js` | Rich per-opportunity mock (tasks, commercials, documents, FY27 phasing) keyed by demo IDs |
| `src/data/rfpMock.js` | Simulated RFP extraction with timed steps and hardcoded field payloads |
| `src/store/Store.jsx` | `localStorage` key `dealpulse-demo-v14`, `RESET` reloading seeds |
| `src/data/defaults.js` | Rotating `LEAD_SAMPLES` / `OPP_SAMPLES` on new forms |
| `src/components/ContactPicker.jsx` | `MOCK_CONTACTS` |
| `src/components/EmailPicker.jsx` | `MOCK_EMAILS` |
| `src/pages/Dashboard.jsx` | KPIs and to-dos derived from seed store; hardcoded `TEAM` table |
| `src/pages/PostPO.jsx` | `seedPostPo` + static KPI counts |
| `src/pages/Compliance.jsx` | `EXPERTS` demo roster (names) |
| `src/pages/Opportunity.jsx` | `INTERNAL` / `REVIEWERS` names; `withExtras` merge |
| `src/data/verticals.js` | Demo user personas and `DEMO_PASSWORD` |
| `src/components/Layout.jsx` | “Reset demo data” control |

Legitimate configuration kept (not business records):

- Picklists and enums in `src/data/defaults.js`, `merchantCategories.js`, `complianceTemplates.js`
- Development-only vertical permissions in `src/data/verticals.js` (navigation and `can` flags)
- `sessionStorage`: CSRF token (`dealplus.csrfToken`), vertical override (`dealpulse-vertical`) for dev UX

## Mock data removed

- Deleted `seed.js`, `oppExtras.js`, `rfpMock.js`
- Store initializes empty arrays; no `localStorage` persistence of business state
- Removed “Reset demo data”, “Load another sample”, and rotating form samples
- Replaced mock contacts/mailbox with integration placeholders
- RFP extract no longer returns fake parsed fields
- Post-PO screen no longer renders seeded activities/EMD/KPIs
- Dashboard team table derives owners from loaded opportunities only
- Hardcoded employee name lists replaced with current user (or empty expert rosters)

## Files modified

**New**

- `frontend/src/api/unwrap.js`
- `frontend/src/hooks/useAsyncData.js`
- `frontend/src/components/AsyncState.jsx`
- `frontend/src/mappers/leadMapper.js`
- `frontend/src/mappers/opportunityMapper.js`
- `frontend/src/store/BusinessData.jsx`
- `frontend/src/data/complianceTemplates.js`
- `frontend/src/data/peopleOptions.js`

**Updated (representative)**

- `Store.jsx`, `App.jsx`, `Auth.jsx`, `Login.jsx`, `Layout.jsx`
- `Leads.jsx`, `LeadDetail.jsx`, `Pipeline.jsx`, `Dashboard.jsx`, `Opportunity.jsx`, `Compliance.jsx`, `PostPO.jsx`
- `NewOpportunity.jsx`, `LeadFields.jsx`, `ContactPicker.jsx`, `EmailPicker.jsx`, `RfpExtract.jsx`
- `defaults.js`, `verticals.js`, `endpoints.js`, `leadService.js`, `opportunityService.js`

**Deleted**

- `frontend/src/data/seed.js`
- `frontend/src/data/oppExtras.js`
- `frontend/src/data/rfpMock.js`

## Screens affected

| Screen | Behaviour after cleanup |
|--------|-------------------------|
| Login | Command Module sign-in; no demo password constant |
| Dashboard | KPIs/to-dos from in-memory store (API-fed leads/opps only); loading/error/retry |
| Leads | List from `GET /api/v1/leads`; create via `POST`; empty/error states |
| Lead detail | Fetch `GET /api/v1/leads/:id` if not in cache |
| Opportunities | List from `GET /api/v1/opportunities`; detail fetch `GET .../:id` |
| RFP synopsis | No seed synopses (still uses store until RFP API wired) |
| Compliance | No seed matrices; expert picklists empty |
| Pre-PO / Decisions | Empty store-backed lists (no seeds) |
| Post-PO | Integration notice + empty state |
| New lead / opportunity forms | Empty defaults; no sample loader |

## API endpoints used

| Endpoint | Service layer | UI usage |
|----------|---------------|----------|
| `GET/POST/PATCH /api/v1/leads` | `leadService` | Leads list, create, detail fetch |
| `GET /api/v1/leads/:id` | `leadService` | Lead detail |
| `GET /api/v1/opportunities` | `opportunityService` | Pipeline, dashboard counts |
| `GET /api/v1/opportunities/:id` | `opportunityService` | Opportunity detail |
| `GET /api/v1/opportunities/pipeline` | `opportunityService` (defined, not yet used on dashboard aggregations) | — |
| `GET /api/v1/rfps` | `rfpService` | RfpExtract availability probe only (no extraction) |
| `GET /api/auth/login`, `/api/me`, CSRF | `authService` | Login (unchanged) |

Gateway base: `VITE_API_BASE_URL` (default `http://localhost:3000/api/v1`).

## Missing backend APIs (integration dependencies)

| UI capability | Gap |
|---------------|-----|
| Dashboard pending approvals / decisions / synopses / compliance counts | No unified aggregation; `approvalService`, synopsis, and compliance UIs still store-local or empty |
| RFP field extraction | Document upload + extraction under `/rfps/:id` not wired |
| RFP synopsis CRUD | `rfpService` exists; pages still use store reducer |
| Opportunity create/update from UI | `ADD_OPP` / patches still in-memory; `POST/PATCH /opportunities` not called from forms |
| Lead approval / qualification workflow | Lead detail still dispatches local actions; need lead lifecycle + history APIs on actions |
| Compliance matrices | `GET /api/v1/compliance` gateway mismatch (service uses `/frameworks`, `/assessments`) |
| Assignments / SME roster | `assignmentService.list` not wired; owner/expert dropdowns minimal |
| Pre-PO evaluations | No frontend service calls |
| Post-PO workspace | Out of Scope 1 — no API |
| Contact picker / email tag | Microsoft Graph / CRM |
| Teams toast simulation | Local `teams` array only (not business records; assignment API TBD) |
| User directory for owners | Map `ownerId` to display names |

## Remaining `localStorage` / `sessionStorage`

| Key | Purpose |
|-----|---------|
| `dealplus.csrfToken` | CSRF for mutating API calls (`sessionStorage`) |
| `dealpulse-vertical` | Development-only vertical switch (`sessionStorage`) |

No business entities are persisted in the browser.

## Validation results

| Check | Result |
|-------|--------|
| `npm --prefix frontend run build` | Pass |
| `npm run verify` (repo root) | Pass (frontend build + backend tests) |
| Repository lint script | N/A (not configured) |
| Frontend unit tests | N/A (none in package) |

Manual smoke: all hash routes should render; screens without API data show empty or error states rather than fabricated records.

## Unresolved issues

1. **Field mapping:** UI lead shape (e.g. `approval`, `owner` name, `module` string) differs from lead-service DTOs; full parity on edit/approval paths not implemented.
2. **Opportunity detail:** Rich tabs (commercials, documents, evaluations) expect data that previously came from `oppExtras`; lists are empty until nested opportunity APIs are integrated.
3. **In-memory workflow:** Synopsis, decisions, compliance rows, evaluations still use `useReducer` without API sync — workflows appear empty after refresh.
4. **Compliance gateway:** `/api/v1/compliance` may not route to compliance-service handlers until gateway paths align (see system design doc).
5. **Auth / vertical:** Vertical permissions remain dev-only; production IAM not integrated.

## Summary

Mock seeds, browser persistence, and simulated RFP/contacts/mailbox data were removed. Leads and opportunities list/detail flows load from the API gateway with loading, empty, and error UI. Other workflow screens retain layout and interactions but show real empty states until their services are connected. Backend work is required for approvals, synopsis, compliance, opportunity mutations, aggregations, and Scope 2 integrations listed above.