import {
  optionalNonEmptyString,
  requireActorRole,
  requireNonEmptyString,
  requireRecord,
} from '../shared/validation';
import { ActorRole } from '../shared/roles';

export interface SubmitApprovalInput {
  leadId: string;
  creatorId: string;
  creatorRole: ActorRole;
  productVertical: string;
  teamId: string;
  territoryId: string;
  idempotencyKey: string;
  /** PRD: approver chosen at submission. When omitted, legacy vertical mapping selects P&L Head. */
  nextApproverId?: string;
}

export interface ListApprovalsQuery {
  status?: string;
  leadId?: string;
  requesterId?: string;
  approverId?: string;
}

export interface ReassignApprovalInput {
  newApproverId: string;
  comment?: string;
}

export interface ApproveApprovalInput {
  comment?: string;
}

export interface RejectApprovalInput {
  reason: string;
}

export function parseSubmitApprovalInput(value: unknown): SubmitApprovalInput {
  const record = requireRecord(value);
  return {
    leadId: requireNonEmptyString(record['leadId'], 'leadId'),
    creatorId: requireNonEmptyString(record['creatorId'], 'creatorId'),
    creatorRole: requireActorRole(record['creatorRole'], 'creatorRole'),
    productVertical: requireNonEmptyString(record['productVertical'], 'productVertical'),
    teamId: requireNonEmptyString(record['teamId'], 'teamId'),
    territoryId: requireNonEmptyString(record['territoryId'], 'territoryId'),
    idempotencyKey: requireNonEmptyString(record['idempotencyKey'], 'idempotencyKey'),
    ...(optionalNonEmptyString(record['nextApproverId'], 'nextApproverId') === undefined
      ? {}
      : { nextApproverId: requireNonEmptyString(record['nextApproverId'], 'nextApproverId') }),
  };
}

export function parseListApprovalsQuery(value: unknown): ListApprovalsQuery {
  const record = requireRecord(value ?? {});
  const status = optionalNonEmptyString(record['status'], 'status');
  const leadId = optionalNonEmptyString(record['leadId'], 'leadId');
  const requesterId = optionalNonEmptyString(record['requesterId'], 'requesterId');
  const approverId = optionalNonEmptyString(record['approverId'], 'approverId');
  return {
    ...(status ? { status } : {}),
    ...(leadId ? { leadId } : {}),
    ...(requesterId ? { requesterId } : {}),
    ...(approverId ? { approverId } : {}),
  };
}

export function parseReassignApprovalInput(value: unknown): ReassignApprovalInput {
  const record = requireRecord(value);
  const comment = optionalNonEmptyString(record['comment'], 'comment');
  return {
    newApproverId: requireNonEmptyString(record['newApproverId'], 'newApproverId'),
    ...(comment ? { comment } : {}),
  };
}

export function parseApproveApprovalInput(value: unknown): ApproveApprovalInput {
  const record = requireRecord(value ?? {});
  const comment = optionalNonEmptyString(record['comment'], 'comment');
  return comment === undefined ? {} : { comment };
}

export function parseRejectApprovalInput(value: unknown): RejectApprovalInput {
  const record = requireRecord(value);
  return { reason: requireNonEmptyString(record['reason'], 'reason') };
}
