import { HistoryActorRole } from '../shared/roles';

export const APPROVAL_STATUSES = [
  'PENDING_PNL_HEAD',
  'PENDING_SALES_MANAGER',
  'APPROVED',
  'REJECTED',
] as const;

export type ApprovalStatus = (typeof APPROVAL_STATUSES)[number];

export type ApprovalAuthorityRole = 'PNL_HEAD' | 'SALES_MANAGER';

export const ACTIVE_APPROVAL_STATUSES: readonly ApprovalStatus[] = [
  'PENDING_PNL_HEAD',
  'PENDING_SALES_MANAGER',
];

export const APPROVAL_HISTORY_TYPES = [
  'SUBMITTED',
  'AUTHORITY_TRANSFERRED',
  'APPROVED',
  'REJECTED',
  'DECISION_BLOCKED',
] as const;

export type ApprovalHistoryType = (typeof APPROVAL_HISTORY_TYPES)[number];

export interface ApprovalRequest {
  id: string;
  leadId: string;
  creatorId: string;
  productVertical: string;
  teamId: string;
  territoryId: string;
  taskIds?: readonly string[];
  documentIds?: readonly string[];
  status: ApprovalStatus;
  currentAuthorityRole: ApprovalAuthorityRole;
  currentApproverId: string;
  originalApproverId: string;
  submissionIdempotencyKey: string;
  decisionIdempotencyKey?: string;
  decisionId?: string;
  expiresAt: string;
  submittedAt: string;
  transferredAt?: string;
  updatedAt: string;
  version: number;
}

export interface ApprovalHistoryEvent {
  id: string;
  approvalId: string;
  type: ApprovalHistoryType;
  actorId: string;
  actorRole: HistoryActorRole;
  timestamp: string;
  idempotencyKey: string;
  previousApproverId?: string;
  newApproverId?: string;
  comment?: string;
  reason?: string;
}
