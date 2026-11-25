import { ApprovalHistoryEvent, ApprovalRequest } from '../approvals/approval.types';
import { Decision } from '../decisions/decision.types';
import { ApprovalHistoryEventEntity } from './entities/approval-history-event.entity';
import { ApprovalRequestEntity } from './entities/approval-request.entity';
import { DecisionEntity } from './entities/decision.entity';

export function toDomainApproval(row: ApprovalRequestEntity): ApprovalRequest {
  return {
    id: row.id,
    leadId: row.leadId,
    creatorId: row.creatorId,
    productVertical: row.productVertical,
    teamId: row.teamId,
    territoryId: row.territoryId,
    ...(row.taskIds?.length ? { taskIds: row.taskIds } : {}),
    ...(row.documentIds?.length ? { documentIds: row.documentIds } : {}),
    status: row.status,
    currentAuthorityRole: row.currentAuthorityRole,
    currentApproverId: row.currentApproverId,
    originalApproverId: row.originalApproverId,
    submissionIdempotencyKey: row.submissionIdempotencyKey,
    ...(row.decisionIdempotencyKey ? { decisionIdempotencyKey: row.decisionIdempotencyKey } : {}),
    ...(row.decisionId ? { decisionId: row.decisionId } : {}),
    expiresAt: row.expiresAt.toISOString(),
    submittedAt: row.submittedAt.toISOString(),
    ...(row.transferredAt ? { transferredAt: row.transferredAt.toISOString() } : {}),
    updatedAt: row.updatedAt.toISOString(),
    version: row.version,
  };
}

export function toEntityApproval(domain: ApprovalRequest): ApprovalRequestEntity {
  const row = new ApprovalRequestEntity();
  row.id = domain.id;
  row.leadId = domain.leadId;
  row.creatorId = domain.creatorId;
  row.productVertical = domain.productVertical;
  row.teamId = domain.teamId;
  row.territoryId = domain.territoryId;
  row.taskIds = domain.taskIds ? [...domain.taskIds] : null;
  row.documentIds = domain.documentIds ? [...domain.documentIds] : null;
  row.status = domain.status;
  row.currentAuthorityRole = domain.currentAuthorityRole;
  row.currentApproverId = domain.currentApproverId;
  row.originalApproverId = domain.originalApproverId;
  row.submissionIdempotencyKey = domain.submissionIdempotencyKey;
  row.decisionIdempotencyKey = domain.decisionIdempotencyKey ?? null;
  row.decisionId = domain.decisionId ?? null;
  row.expiresAt = new Date(domain.expiresAt);
  row.submittedAt = new Date(domain.submittedAt);
  row.transferredAt = domain.transferredAt ? new Date(domain.transferredAt) : null;
  row.updatedAt = new Date(domain.updatedAt);
  row.version = domain.version;
  return row;
}

export function toDomainDecision(row: DecisionEntity): Decision {
  return {
    id: row.id,
    approvalId: row.approvalId,
    outcome: row.outcome,
    actorId: row.actorId,
    actorRole: row.actorRole,
    decidedAt: row.decidedAt.toISOString(),
    idempotencyKey: row.idempotencyKey,
    ...(row.comment ? { comment: row.comment } : {}),
    ...(row.reason ? { reason: row.reason } : {}),
  };
}

export function toEntityDecision(domain: Decision): DecisionEntity {
  const row = new DecisionEntity();
  row.id = domain.id;
  row.approvalId = domain.approvalId;
  row.outcome = domain.outcome;
  row.actorId = domain.actorId;
  row.actorRole = domain.actorRole;
  row.decidedAt = new Date(domain.decidedAt);
  row.idempotencyKey = domain.idempotencyKey;
  row.comment = domain.comment ?? null;
  row.reason = domain.reason ?? null;
  return row;
}

export function toDomainHistory(row: ApprovalHistoryEventEntity): ApprovalHistoryEvent {
  return {
    id: row.id,
    approvalId: row.approvalId,
    type: row.type,
    actorId: row.actorId,
    actorRole: row.actorRole,
    timestamp: row.timestamp.toISOString(),
    idempotencyKey: row.idempotencyKey,
    ...(row.previousApproverId ? { previousApproverId: row.previousApproverId } : {}),
    ...(row.newApproverId ? { newApproverId: row.newApproverId } : {}),
    ...(row.comment ? { comment: row.comment } : {}),
    ...(row.reason ? { reason: row.reason } : {}),
  };
}

export function toEntityHistory(domain: ApprovalHistoryEvent): ApprovalHistoryEventEntity {
  const row = new ApprovalHistoryEventEntity();
  row.id = domain.id;
  row.approvalId = domain.approvalId;
  row.type = domain.type;
  row.actorId = domain.actorId;
  row.actorRole = domain.actorRole;
  row.timestamp = new Date(domain.timestamp);
  row.idempotencyKey = domain.idempotencyKey;
  row.previousApproverId = domain.previousApproverId ?? null;
  row.newApproverId = domain.newApproverId ?? null;
  row.comment = domain.comment ?? null;
  row.reason = domain.reason ?? null;
  return row;
}