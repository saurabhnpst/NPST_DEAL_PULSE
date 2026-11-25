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
