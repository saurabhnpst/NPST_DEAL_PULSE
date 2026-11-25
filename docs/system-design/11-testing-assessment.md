# Testing Assessment

Source inspection of `**/*.spec.ts` and `package.json` scripts only. **NOT VERIFIED:** last CI run results.

## Backend automated tests

| Service | Unit / component tests | Integration tests | Notes |
|---------|------------------------|-------------------|-------|
| Lead | 4 spec files (leads, qualifications, history) | None in package scripts | Run: `npm run test:leads` |
| Document | 1 spec (file-validation) | None | `npm run test:documents` |
| RFP | Many (pdf, extraction, rfps, client) | `jest.rfp.integration.config.js` | Needs DB env, `rfp_db`, optional `RUN_RFP_DOCUMENT_E2E` |
| Gateway | None found | None | |
| Stubs | None | None | |

## Frontend

| Type | Status |
|------|--------|
| Unit tests | **MISSING** (no jest/vitest in package.json) |
| E2E (Playwright/Cypress) | **MISSING** |

## Suggested test focus (roadmap input)

1. Lead API contract tests via gateway (supertest).
2. Document upload/download e2e with LocalStack.
3. RFP integration suite in CI with dockerized Redis + MySQL.
4. Auth e2e: login → CSRF → lead POST with cookie.
5. Frontend vitest for `leadService` + one page integration test.

## Build verification (historical note)

Document pack creation did not run builds in this read-only pass. Prior work in repo reported `nest build` for lead/document/rfp/gateway and `vite build` succeed when deps installed.