# DealPlus API catalogue (proposed)

Base URL through Gateway: `/api/v1`. Most routes remain proposed contracts. Approval-service mock endpoints run standalone at `http://localhost:3006/api/v1` for local verification. Protect routes with authentication and permission checks. Paginate list endpoints and standardize errors.

## Auth & users
- POST `/auth/login`, `/auth/refresh`, `/auth/logout`
- GET `/auth/me`
- POST `/auth/forgot-password`, `/auth/reset-password`
- GET/POST `/users`; GET/PATCH `/users/:id`
- GET/POST `/roles`; PATCH `/roles/:id`
- GET `/permissions`, `/verticals`

## Leads, accounts and contacts
- POST/GET `/leads`; GET/PATCH/DELETE `/leads/:id`
- PATCH `/leads/:id/status`
- POST `/leads/:id/submit-approval`, `/leads/:id/qualify`, `/leads/:id/convert`
- GET `/leads/:id/history`
- GET/POST `/leads/:id/contacts`; PATCH `/leads/:id/contacts/:contactId`
- GET/POST `/accounts`; GET/PATCH `/accounts/:id`
- GET/POST `/contacts`; GET/PATCH `/contacts/:id`

## Documents
- POST `/documents/upload` (multipart/form-data)
- GET `/documents`, `/documents/:id`, `/documents/:id/download`
- PATCH/DELETE `/documents/:id`
- POST/GET `/documents/:id/links`; DELETE `/documents/:id/links/:linkId`
- GET `/leads/:leadId/documents`, `/opportunities/:opportunityId/documents`
- POST/GET `/documents/:id/versions`

## RFP and synopsis
- POST `/rfp/:documentId/process`
- GET `/rfp/:documentId/status`, `/rfp/:documentId/extracted-data`
- PATCH `/rfp/:documentId/extracted-data`
- POST `/rfp/:documentId/reprocess`
- POST/GET `/rfp/synopses`; GET/PATCH `/rfp/synopses/:id`
- POST `/rfp/synopses/:id/submit`, `/accept`, `/return`

## Opportunities
- POST/GET `/opportunities`; GET/PATCH `/opportunities/:id`
- GET `/opportunities/:id/history`, `/opportunities/:id/stages`
- POST `/opportunities/:id/stages/:stageId/complete`
- POST `/opportunities/:id/stages/:stageId/proceed`
- GET/PATCH `/opportunities/:id/revenue`
- POST `/opportunities/:id/hold`, `/reopen`, `/close-won`, `/close-lost`
- PATCH `/opportunities/:id/fallback`
- GET `/opportunities/pipeline`

## Approvals and decisions
- GET `/approvals`, `/approvals/pending`, `/approvals/:id`
- POST `/approvals/:id/approve`, `/reject`, `/request-changes`
- GET `/approvals/:id/history`
- GET `/decisions`, `/decisions/pending`, `/decisions/:id`
- POST `/decisions/:id/recommendation`, `/proceed`, `/reject`

## Assignments
- GET `/assignments`
- GET `/assignments/opportunity/:opportunityId`
- POST `/assignments/opportunity/:opportunityId/auto-assign`
- POST `/assignments/opportunity/:opportunityId`
- PATCH `/assignments/:id`; GET `/assignments/:id/history`
- GET/POST `/product-verticals`; PATCH `/product-verticals/:id`
- GET/POST `/vertical-assignments`; PATCH `/vertical-assignments/:id`

## Compliance
- POST/GET `/compliance`; GET `/compliance/:opportunityId`
- POST `/compliance/:id/lines`
- PATCH/DELETE `/compliance/lines/:lineId`
- POST `/compliance/lines/:lineId/approve`, `/reject`
- POST/GET `/compliance/:id/evidence`
- GET `/compliance/:id/progress`
- POST `/compliance/:id/signoff`
- GET `/compliance/:id/history`

## Pre-PO and Post-PO
- POST/GET `/pre-po`; GET/PATCH `/pre-po/:id`
- PATCH `/pre-po/:id/status`
- POST `/pre-po/:id/submit`, `/approve`, `/reject`
- POST/GET `/post-po`; GET/PATCH `/post-po/:id`
- POST `/post-po/:id/milestones`
- PATCH `/post-po/:id/milestones/:milestoneId`
- GET `/post-po/:id/progress`

## Notifications and reporting
- GET `/notifications`, `/notifications/unread`
- PATCH `/notifications/:id/read`, `/notifications/read-all`
- GET/PATCH `/notifications/preferences`
- GET `/dashboard/summary`, `/dashboard/sales`, `/dashboard/pl`, `/dashboard/presales`
- GET `/dashboard/pipeline`, `/dashboard/lead-summary`, `/dashboard/approval-summary`
- GET `/dashboard/compliance-summary`, `/dashboard/pre-po-summary`, `/dashboard/recent-activity`

## Initial event catalogue
LeadCreated, LeadSubmittedForApproval, ApprovalApproved, ApprovalRejected, ApprovalChangesRequested, DocumentUploaded, RfpExtractionCompleted, SynopsisAccepted, OpportunityCreated, OpportunityStageChanged, TechnicalAssignmentCreated, ComplianceSignedOff, EvaluationStatusChanged.

Use a versioned event envelope with event ID, event type, schema version, occurred-at timestamp, producer and correlation ID. Consumers must be idempotent.
