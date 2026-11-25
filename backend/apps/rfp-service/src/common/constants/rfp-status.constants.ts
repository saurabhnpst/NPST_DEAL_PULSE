export const RFP_STATUSES = [
  'Draft',
  'Registered',
  'In Review',
  'Submitted',
  'Closed',
  'Withdrawn',
] as const;

export type RfpStatus = (typeof RFP_STATUSES)[number];

export const DEFAULT_RFP_STATUS: RfpStatus = 'Draft';