import { ActorRole } from '../shared/roles';
import { ApprovalAuthorityRole, ApprovalStatus } from '../approvals/approval.types';

export const DECISION_OUTCOMES = ['APPROVED', 'REJECTED'] as const;

export type DecisionOutcome = (typeof DECISION_OUTCOMES)[number];

export interface Decision {
  id: string;
  approvalId: string;
  outcome: DecisionOutcome;
  actorId: string;
  actorRole: ActorRole;
  decidedAt: string;
  idempotencyKey: string;
  comment?: string;
  reason?: string;
}

export interface PendingDecisionView {
  approvalId: string;
  leadId: string;
  status: ApprovalStatus;
  currentAuthorityRole: ApprovalAuthorityRole;
  expiresAt: string;
  submittedAt: string;
}
