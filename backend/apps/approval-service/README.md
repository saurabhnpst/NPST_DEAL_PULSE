# approval-service

NestJS application for DealPlus Scope 1 approval workflow (mock-only local execution).

- Entry point: `src/main.ts`
- Module: `src/app.module.ts`
- Health check: `GET /api/v1/health`
- Implementation context: [`Approval_services_context.md`](Approval_services_context.md)
- Dependency and mock catalog: [`DEPENDENCY_HANDLING.md`](DEPENDENCY_HANDLING.md)
- Typed fixtures: [`src/mock/fixtures.ts`](src/mock/fixtures.ts)

Business endpoints and domain rules are implemented against in-memory mocks. Swap real adapters via DI tokens in `DEPENDENCY_HANDLING.md`; update provider bindings in `AppModule` at integration.