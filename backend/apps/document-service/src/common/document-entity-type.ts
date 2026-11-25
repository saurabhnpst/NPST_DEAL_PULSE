export const DOCUMENT_ENTITY_TYPES = [
  'LEAD',
  'PROPOSAL',
  'BANK',
  'PROJECT',
  'APPROVAL',
  'CONTRACT',
  'OPPORTUNITY',
  'RFP',
] as const;

export type DocumentEntityType = (typeof DOCUMENT_ENTITY_TYPES)[number];

export function isDocumentEntityType(value: string): value is DocumentEntityType {
  return (DOCUMENT_ENTITY_TYPES as readonly string[]).includes(value);
}