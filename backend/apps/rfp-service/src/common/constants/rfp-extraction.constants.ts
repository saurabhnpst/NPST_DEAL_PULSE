export const RFP_EXTRACTION_JOB_STATUS = {
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  PARTIALLY_COMPLETED: 'partially_completed',
  FAILED: 'failed',
  REVIEW_PENDING: 'review_pending',
  CONFIRMED: 'confirmed',
} as const;

export type RfpExtractionJobStatus =
  (typeof RFP_EXTRACTION_JOB_STATUS)[keyof typeof RFP_EXTRACTION_JOB_STATUS];

export const RFP_VERSION_TYPE = {
  INITIAL: 'initial',
  AMENDMENT: 'amendment',
} as const;

export type RfpVersionType =
  (typeof RFP_VERSION_TYPE)[keyof typeof RFP_VERSION_TYPE];

export const RFP_FIELD_REVIEW_STATUS = {
  DRAFT: 'draft',
  ACCEPTED: 'accepted',
  CORRECTED: 'corrected',
  REJECTED: 'rejected',
  UNRESOLVED: 'unresolved',
  CONFIRMED: 'confirmed',
} as const;

export type RfpFieldReviewStatus =
  (typeof RFP_FIELD_REVIEW_STATUS)[keyof typeof RFP_FIELD_REVIEW_STATUS];

export const RFP_FIELD_DATA_TYPE = {
  STRING: 'string',
  TEXT: 'text',
  DATE: 'date',
  BOOLEAN: 'boolean',
  NUMBER: 'number',
} as const;

export type RfpFieldDataType =
  (typeof RFP_FIELD_DATA_TYPE)[keyof typeof RFP_FIELD_DATA_TYPE];

export const RFP_AMENDMENT_CHANGE_CATEGORY = {
  ADDED: 'added',
  CHANGED: 'changed',
  REMOVED: 'removed',
  UNCLEAR: 'unclear',
} as const;

export type RfpAmendmentChangeCategory =
  (typeof RFP_AMENDMENT_CHANGE_CATEGORY)[keyof typeof RFP_AMENDMENT_CHANGE_CATEGORY];

export const RFP_EXTRACTION_QUEUE = 'rfp-information-extraction';

export const RFP_FIELD_CATEGORY = {
  CLIENT: 'client_tender',
  SCOPE: 'scope',
  SUBMISSION: 'submission',
  ELIGIBILITY: 'eligibility',
  COMMERCIAL: 'commercial',
  TECHNICAL: 'technical',
  OTHER: 'other',
} as const;