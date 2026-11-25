import { conflictError, notFoundError } from '../shared/errors';
import {
  ApprovalHistoryEvent,
  ApprovalRequest,
  ACTIVE_APPROVAL_STATUSES,
} from './approval.types';
import {
  ApprovalRepository,
  DecisionCommit,
  SubmitCommit,
  TransferCommit,
  TransferResult,
} from './approval.repository';
import { Decision } from '../decisions/decision.types';

export class InMemoryApprovalRepository implements ApprovalRepository {
  private readonly approvals = new Map<string, ApprovalRequest>();
  private readonly activeByLead = new Map<string, string>();
  private readonly submissionKeys = new Map<string, string>();
  private readonly decisions = new Map<string, Decision>();
  private readonly decisionByApproval = new Map<string, string>();
  private readonly decisionKeys = new Map<string, string>();
  private readonly historyByApproval = new Map<string, ApprovalHistoryEvent[]>();

  async submit(commit: SubmitCommit): Promise<ApprovalRequest> {
    const existingId = this.submissionKeys.get(commit.history.idempotencyKey);
    if (existingId !== undefined) {
      return this.cloneApproval(this.requireApproval(existingId));
    }
    const activeId = this.activeByLead.get(commit.approval.leadId);
    if (activeId !== undefined) {
      const active = this.approvals.get(activeId);
      if (active !== undefined && ACTIVE_APPROVAL_STATUSES.includes(active.status)) {
        throw conflictError('Active approval already exists for lead');
      }
      this.activeByLead.delete(commit.approval.leadId);
    }
    const stored = this.cloneApproval({ ...commit.approval, version: 1 });
    this.approvals.set(stored.id, stored);
    this.activeByLead.set(stored.leadId, stored.id);
    this.submissionKeys.set(stored.submissionIdempotencyKey, stored.id);
    this.historyByApproval.set(stored.id, [commit.history]);
    return this.cloneApproval(stored);
  }

  async commitDecision(commit: DecisionCommit): Promise<ApprovalRequest> {
    const existing = this.decisionKeys.get(commit.decision.idempotencyKey);
    if (existing !== undefined) {
      return this.cloneApproval(this.requireApproval(existing));
    }
    const current = this.requireApproval(commit.approvalId);
    this.assertVersion(current, commit.expectedVersion);
    if (current.decisionId !== undefined) {
      throw conflictError('Approval already decided');
    }
    const updated = this.cloneApproval({
      ...current,
      status: commit.decision.outcome,
      decisionId: commit.decision.id,
      decisionIdempotencyKey: commit.decision.idempotencyKey,
      updatedAt: commit.decision.decidedAt,
      version: current.version + 1,
    });
    this.approvals.set(updated.id, updated);
    this.decisions.set(commit.decision.id, commit.decision);
    this.decisionByApproval.set(commit.approvalId, commit.decision.id);
    this.decisionKeys.set(commit.decision.idempotencyKey, commit.approvalId);
    this.storeHistory(commit.approvalId, commit.history);
    if (!ACTIVE_APPROVAL_STATUSES.includes(updated.status)) {
      this.activeByLead.delete(updated.leadId);
    }
    return this.cloneApproval(updated);
  }

  async commitTransfer(commit: TransferCommit): Promise<TransferResult> {
    const current = this.requireApproval(commit.approvalId);
    if (current.transferredAt !== undefined) {
      return { approval: this.cloneApproval(current), created: false };
    }
    this.assertVersion(current, commit.expectedVersion);
    const updated = this.cloneApproval({
      ...commit.approval,
      version: current.version + 1,
    });
    this.approvals.set(updated.id, updated);
    this.storeHistory(commit.approvalId, commit.history);
    return { approval: this.cloneApproval(updated), created: true };
  }

  async findById(id: string): Promise<ApprovalRequest | undefined> {
    const approval = this.approvals.get(id);
    return approval === undefined ? undefined : this.cloneApproval(approval);
  }

  async findActiveByLeadId(leadId: string): Promise<ApprovalRequest | undefined> {
    const id = this.activeByLead.get(leadId);
    if (id === undefined) {
      return undefined;
    }
    const approval = this.approvals.get(id);
    if (approval === undefined || !ACTIVE_APPROVAL_STATUSES.includes(approval.status)) {
      this.activeByLead.delete(leadId);
      return undefined;
    }
    return this.cloneApproval(approval);
  }

  async findBySubmissionKey(idempotencyKey: string): Promise<ApprovalRequest | undefined> {
    const id = this.submissionKeys.get(idempotencyKey);
    return id === undefined ? undefined : this.findById(id);
  }

  async findDecisionById(id: string): Promise<Decision | undefined> {
    return this.decisions.get(id);
  }

  async findDecisionByApprovalId(approvalId: string): Promise<Decision | undefined> {
    const id = this.decisionByApproval.get(approvalId);
    return id === undefined ? undefined : this.decisions.get(id);
  }

  async findDecisionByIdempotencyKey(idempotencyKey: string): Promise<Decision | undefined> {
    const approvalId = this.decisionKeys.get(idempotencyKey);
    if (approvalId === undefined) {
      return undefined;
    }
    return this.findDecisionByApprovalId(approvalId);
  }

  async listApprovals(): Promise<ApprovalRequest[]> {
    return [...this.approvals.values()].map((item) => this.cloneApproval(item));
  }

  async listDecisions(): Promise<Decision[]> {
    return [...this.decisions.values()].map((item) => ({ ...item }));
  }

  async listHistory(approvalId: string): Promise<ApprovalHistoryEvent[]> {
    return (this.historyByApproval.get(approvalId) ?? []).map((item) => ({ ...item }));
  }

  async appendHistory(event: ApprovalHistoryEvent): Promise<void> {
    const events = this.historyByApproval.get(event.approvalId) ?? [];
    if (events.some((item) => item.idempotencyKey === event.idempotencyKey)) {
      return;
    }
    events.push({ ...event });
    this.historyByApproval.set(event.approvalId, events);
  }

  private requireApproval(id: string): ApprovalRequest {
    const approval = this.approvals.get(id);
    if (approval === undefined) {
      throw notFoundError('Approval not found');
    }
    return approval;
  }

  private assertVersion(approval: ApprovalRequest, expectedVersion: number): void {
    if (approval.version !== expectedVersion) {
      throw conflictError('Approval changed during operation');
    }
  }

  private storeHistory(approvalId: string, event: ApprovalHistoryEvent): void {
    const events = this.historyByApproval.get(approvalId) ?? [];
    events.push({ ...event });
    this.historyByApproval.set(approvalId, events);
  }

  private cloneApproval(approval: ApprovalRequest): ApprovalRequest {
    return { ...approval };
  }
}
