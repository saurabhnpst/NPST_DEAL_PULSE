/** All status values used by the Assignment Service, in one place. */

/** Technical assignment (one per opportunity + product workstream). */
export const TECH_STATUS = {
  /** Proposed, waiting for the Solution Manager. */
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  /** Approved: the Tech Lead is notified and the workstream is active. */
  APPROVED: 'APPROVED',
  /** Returned / rejected by the Solution Manager. Can be proposed again. */
  RETURNED: 'RETURNED',
  CANCELLED: 'CANCELLED',
} as const;
export type TechStatus = (typeof TECH_STATUS)[keyof typeof TECH_STATUS];

/** RFP requirement mapping state. */
export const REQUIREMENT_STATUS = {
  /** Has a product and is linked to that product's assignment. */
  MAPPED: 'MAPPED',
  /** No product yet: waits in the review queue, never auto-assigned. */
  UNMAPPED: 'UNMAPPED',
  /** Needs a person to decide (several products, no Tech Lead, inactive Tech Lead…). */
  NEEDS_REVIEW: 'NEEDS_REVIEW',
} as const;
export type RequirementStatus = (typeof REQUIREMENT_STATUS)[keyof typeof REQUIREMENT_STATUS];

/** Sales → Pre-Sales handoff. */
export const HANDOFF_STATUS = {
  REQUESTED: 'REQUESTED',
  ACCEPTED: 'ACCEPTED',
  /** Pre-Sales returned it to Sales with questions. */
  RETURNED: 'RETURNED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type HandoffStatus = (typeof HANDOFF_STATUS)[keyof typeof HANDOFF_STATUS];

/** What a history row / event is about. */
export const SUBJECT = {
  TECHNICAL_ASSIGNMENT: 'TECHNICAL_ASSIGNMENT',
  HANDOFF: 'HANDOFF',
  REQUIREMENT: 'REQUIREMENT',
  PRODUCT_TECH_LEAD: 'PRODUCT_TECH_LEAD',
} as const;
export type Subject = (typeof SUBJECT)[keyof typeof SUBJECT];

export const VERTICALS = ['TSP', 'EVOK'] as const;
