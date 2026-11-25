import { ApprovalHistoryEvent, ApprovalRequest } from './approval.types';
import { Decision } from '../decisions/decision.types';

export const APPROVAL_REPOSITORY = Symbol('APPROVAL_REPOSITORY');

export interface SubmitCommit {
  approval: ApprovalRequest;
  history: ApprovalHistoryEvent;
  extraHistory?: ApprovalHistoryEvent[];
}

export interface ReassignCommit {
  approvalId: string;
  expectedVersion: number;
  approval: ApprovalRequest;
  history: ApprovalHistoryEvent;
}

export interface ApprovalListFilter {
  status?: ApprovalRequest['status'];
  leadId?: string;
  creatorId?: string;
  currentApproverId?: string;
}

export interface DecisionCommit {
  approvalId: string;
  expectedVersion: number;
  decision: Decision;
  history: ApprovalHistoryEvent;
}

export interface TransferCommit {
  approvalId: string;
  expectedVersion: number;
  approval: ApprovalRequest;
  history: ApprovalHistoryEvent;
}

export interface TransferResult {
  approval: ApprovalRequest;
  created: boolean;
}

export interface ApprovalRepository {
  submit(commit: SubmitCommit): Promise<ApprovalRequest>;
  commitDecision(commit: DecisionCommit): Promise<ApprovalRequest>;
  commitTransfer(commit: TransferCommit): Promise<TransferResult>;
  commitReassign(commit: ReassignCommit): Promise<ApprovalRequest>;
  findById(id: string): Promise<ApprovalRequest | undefined>;
  findActiveByLeadId(leadId: string): Promise<ApprovalRequest | undefined>;
  findBySubmissionKey(idempotencyKey: string): Promise<ApprovalRequest | undefined>;
  findDecisionById(id: string): Promise<Decision | undefined>;
  findDecisionByApprovalId(approvalId: string): Promise<Decision | undefined>;
  findDecisionByIdempotencyKey(idempotencyKey: string): Promise<Decision | undefined>;
  listApprovals(filter?: ApprovalListFilter): Promise<ApprovalRequest[]>;
  listDecisions(): Promise<Decision[]>;
  listHistory(approvalId: string): Promise<ApprovalHistoryEvent[]>;
  appendHistory(event: ApprovalHistoryEvent): Promise<void>;
}
