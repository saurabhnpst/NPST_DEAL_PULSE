# Business Data Ownership

One **MySQL database per microservice**. No cross-database writes.

| Domain data | Owning service | Database |
|-------------|----------------|----------|
| Leads, qualifications, lead history | Lead | `lead_db` |
| Opportunities, stages, products, commercials | Opportunity | `opportunity_db` |
| RFP records, PDF jobs, extracted fields | RFP | `rfp_db` |
| File metadata, versions, attachments | Document | `document_db` |
| Approval requests, decisions (when persisted) | Approval | `approval_db` |
| Technical assignments, handoffs | Assignment | `assignment_db` |
| Compliance frameworks, assessments, matrix | Compliance | `compliance_db` |
| Binary file bytes | Document (MinIO) | Object store bucket |

**Logical references only:** `lead_id`, `opportunity_id`, `document_id` UUIDs across services — validated via APIs, not FKs across DBs.