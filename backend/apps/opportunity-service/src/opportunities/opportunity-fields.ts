import { Opportunity } from '../entities/opportunity.entity';

/**
 * Every opportunity field a client may set (create / PATCH).
 * Names match the entity and the API, grouped like the frontend Details tab.
 * Stage is NOT here: it only changes through the stage endpoints.
 */
export const EDITABLE_FIELDS = [
  // Opportunity information
  'name', 'accountName', 'closeDate', 'currency', 'arr', 'oneTime',
  'ownerUserId', 'presalesUserId', 'accountId', 'leadId',
  'recordType', 'leadSource', 'followupDetails', 'updatedCloseDate', 'region',
  'expectedPoDate', 'currentVolume', 'updatedExpectedPoDate', 'yearlyVolumeProjection',
  'projectStartExpected', 'spocFirstName', 'spocLastName', 'firstBillingExpected',
  'businessType', 'territory', 'tag', 'tone',
  // Industry information
  'industry', 'subIndustry', 'merchantCategory', 'accountSize', 'industryRemark',
  // Product description (product slots live in opportunity_products)
  'productRemark', 'solutionType', 'hosting', 'serviceModel', 'productOwner',
  // Stage 1 · Qualification
  'updatedArr', 'contractYears', 'billingFrequency', 'compellingEvent', 'tender',
  'year2', 'year3', 'year4', 'year5', 'transactions', 'oppType', 'partner', 'partnerName',
  'competitors', 'competitionRemarks', 'today', 'implication', 'presentPain', 'painPoint',
  'notes', 'nextStep',
  'fy27Q1', 'fy27Jul', 'fy27Aug', 'fy27Sep', 'fy27Oct', 'fy27Nov', 'fy27Dec',
  'fy27Jan', 'fy27Feb', 'fy27Mar',
  // Stage 2 · Needs Analysis
  'economicBuyer', 'champion', 'nda', 'championOk', 'strategy', 'reqReceived',
  'presalesInvolved', 'presalesName',
  // Stage 3 · Impact Analysis
  'ebAligned', 'success', 'ebMet', 'poc', 'demoDone', 'sow',
  // Stage 4 · Proposal
  'proposalDate', 'criteriaKnown', 'latestFollowupDate', 'criteria',
  // Stage 5 · Negotiation
  'contractShared', 'contractSigned', 'discount', 'signDate', 'commercials',
  'bankInterview', 'documentation', 'bankApproval', 'uatAgreement', 'poReceived',
  // Stage 6 · Closed Won
  'projectStartActual', 'firstBillingDate', 'poDate', 'firstBillingValue', 'poValue',
  // Stage 7 · Closed Lost
  'lostReason', 'lostReasonRemark',
  // On Hold
  'holdReason', 'holdDetails', 'holdUntil',
  // Side panels
  'stageTasks', 'dealTeam',
] as const satisfies readonly (keyof Opportunity)[];

export type EditableField = (typeof EDITABLE_FIELDS)[number];

/** DECIMAL columns: stored as strings by TypeORM/mysql2. */
const AMOUNT_FIELDS = new Set<string>([
  'arr', 'oneTime', 'updatedArr', 'year2', 'year3', 'year4', 'year5',
  'yearlyVolumeProjection', 'firstBillingValue', 'poValue',
  'fy27Q1', 'fy27Jul', 'fy27Aug', 'fy27Sep', 'fy27Oct', 'fy27Nov', 'fy27Dec',
  'fy27Jan', 'fy27Feb', 'fy27Mar',
]);

/** BIGINT ids from other services: stored as strings. */
const ID_FIELDS = new Set<string>(['ownerUserId', 'presalesUserId', 'accountId', 'leadId']);

/** DATE columns: keep only YYYY-MM-DD even if a full ISO timestamp is sent. */
const DATE_FIELDS = new Set<string>([
  'closeDate', 'updatedCloseDate', 'expectedPoDate', 'updatedExpectedPoDate',
  'projectStartExpected', 'firstBillingExpected', 'ebMet', 'proposalDate',
  'latestFollowupDate', 'signDate', 'projectStartActual', 'firstBillingDate',
  'poDate', 'holdUntil',
]);

function toColumnValue(key: string, value: unknown): unknown {
  if (value === null) return null;
  if (AMOUNT_FIELDS.has(key) || ID_FIELDS.has(key)) return String(value);
  if (DATE_FIELDS.has(key)) return String(value).slice(0, 10);
  return value;
}

/**
 * Copies the fields present in `input` onto the entity.
 * `undefined` = leave unchanged, `null` = clear.
 */
export function applyFields(
  entity: Opportunity,
  input: Partial<Record<EditableField, unknown>>,
): void {
  const target = entity as unknown as Record<string, unknown>;
  for (const key of EDITABLE_FIELDS) {
    const value = input[key];
    if (value === undefined) continue;
    target[key] = toColumnValue(key, value);
  }
}
