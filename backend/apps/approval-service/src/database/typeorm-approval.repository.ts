import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import {
  ApprovalListFilter,
  ApprovalRepository,
  DecisionCommit,
  ReassignCommit,
  SubmitCommit,
  TransferCommit,
  TransferResult,
} from '../approvals/approval.repository';
import {
  ACTIVE_APPROVAL_STATUSES,
  ApprovalHistoryEvent,
  ApprovalRequest,
} from '../approvals/approval.types';
import { Decision } from '../decisions/decision.types';
import { conflictError, notFoundError } from '../shared/errors';
import {
  toDomainApproval,
  toDomainDecision,
  toDomainHistory,
  toEntityApproval,
  toEntityDecision,
  toEntityHistory,
} from './approval-mapper';
import {
  ApprovalHistoryEventEntity,
  ApprovalRequestEntity,
  DecisionEntity,
} from './entities';

@Injectable()
export class TypeOrmApprovalRepository implements ApprovalRepository {
  constructor(
    @InjectRepository(ApprovalRequestEntity)
    private readonly approvals: Repository<ApprovalRequestEntity>,
    @InjectRepository(DecisionEntity)
    private readonly decisions: Repository<DecisionEntity>,
    @InjectRepository(ApprovalHistoryEventEntity)
    private readonly history: Repository<ApprovalHistoryEventEntity>,
    private readonly dataSource: DataSource,
  ) {}

  async submit(commit: SubmitCommit): Promise<ApprovalRequest> {
    const existing = await this.findBySubmissionKey(commit.history.idempotencyKey);
    if (existing !== undefined) {
      return existing;
    }
    return this.dataSource.transaction(async (manager) => {
      const requests = manager.getRepository(ApprovalRequestEntity);
      const historyRepo = manager.getRepository(ApprovalHistoryEventEntity);
      const active = await requests.findOne({
        where: { leadId: commit.approval.leadId, status: In([...ACTIVE_APPROVAL_STATUSES]) },
      });
      if (active !== null) {
        throw conflictError('Active approval already exists for lead');
      }
      const row = toEntityApproval({ ...commit.approval, version: 1 });
      await requests.save(row);
      await historyRepo.save(toEntityHistory(commit.history));
      for (const extra of commit.extraHistory ?? []) {
        await historyRepo.save(toEntityHistory(extra));
      }
      return toDomainApproval(row);
    });
  }

  async commitDecision(commit: DecisionCommit): Promise<ApprovalRequest> {
    const existing = await this.findDecisionByIdempotencyKey(commit.decision.idempotencyKey);
    if (existing !== undefined) {
      const approval = await this.findById(existing.approvalId);
      if (approval === undefined) {
        throw notFoundError('Approval not found');
      }
      return approval;
    }
    return this.dataSource.transaction(async (manager) => {
      const requests = manager.getRepository(ApprovalRequestEntity);
      const decisionsRepo = manager.getRepository(DecisionEntity);
      const historyRepo = manager.getRepository(ApprovalHistoryEventEntity);
      const current = await requests.findOne({ where: { id: commit.approvalId } });
      if (current === null) {
        throw notFoundError('Approval not found');
      }
      if (current.version !== commit.expectedVersion) {
        throw conflictError('Approval changed during operation');
      }
      if (current.decisionId !== null) {
        throw conflictError('Approval already decided');
      }
      const updated = toEntityApproval({
        ...toDomainApproval(current),
        status: commit.decision.outcome,
        decisionId: commit.decision.id,
        decisionIdempotencyKey: commit.decision.idempotencyKey,
        updatedAt: commit.decision.decidedAt,
        version: current.version + 1,
      });
      await decisionsRepo.save(toEntityDecision(commit.decision));
      const result = await requests.save(updated);
      await historyRepo.save(toEntityHistory(commit.history));
      return toDomainApproval(result);
    });
  }

  async commitTransfer(commit: TransferCommit): Promise<TransferResult> {
    return this.dataSource.transaction(async (manager) => {
      const requests = manager.getRepository(ApprovalRequestEntity);
      const historyRepo = manager.getRepository(ApprovalHistoryEventEntity);
      const current = await requests.findOne({ where: { id: commit.approvalId } });
      if (current === null) {
        throw notFoundError('Approval not found');
      }
      if (current.transferredAt !== null) {
        return { approval: toDomainApproval(current), created: false };
      }
      if (current.version !== commit.expectedVersion) {
        throw conflictError('Approval changed during operation');
      }
      const updated = toEntityApproval({ ...commit.approval, version: current.version + 1 });
      const result = await requests.save(updated);
      await historyRepo.save(toEntityHistory(commit.history));
      return { approval: toDomainApproval(result), created: true };
    });
  }

  async commitReassign(commit: ReassignCommit): Promise<ApprovalRequest> {
    return this.dataSource.transaction(async (manager) => {
      const requests = manager.getRepository(ApprovalRequestEntity);
      const historyRepo = manager.getRepository(ApprovalHistoryEventEntity);
      const current = await requests.findOne({ where: { id: commit.approvalId } });
      if (current === null) {
        throw notFoundError('Approval not found');
      }
      if (current.version !== commit.expectedVersion) {
        throw conflictError('Approval changed during operation');
      }
      const updated = toEntityApproval({ ...commit.approval, version: current.version + 1 });
      const result = await requests.save(updated);
      await historyRepo.save(toEntityHistory(commit.history));
      return toDomainApproval(result);
    });
  }

  async findById(id: string): Promise<ApprovalRequest | undefined> {
    const row = await this.approvals.findOne({ where: { id } });
    return row === null ? undefined : toDomainApproval(row);
  }

  async findActiveByLeadId(leadId: string): Promise<ApprovalRequest | undefined> {
    const row = await this.approvals.findOne({
      where: { leadId, status: In([...ACTIVE_APPROVAL_STATUSES]) },
    });
    return row === null ? undefined : toDomainApproval(row);
  }

  async findBySubmissionKey(idempotencyKey: string): Promise<ApprovalRequest | undefined> {
    const row = await this.approvals.findOne({
      where: { submissionIdempotencyKey: idempotencyKey },
    });
    return row === null ? undefined : toDomainApproval(row);
  }

  async findDecisionById(id: string): Promise<Decision | undefined> {
    const row = await this.decisions.findOne({ where: { id } });
    return row === null ? undefined : toDomainDecision(row);
  }

  async findDecisionByApprovalId(approvalId: string): Promise<Decision | undefined> {
    const row = await this.decisions.findOne({ where: { approvalId } });
    return row === null ? undefined : toDomainDecision(row);
  }

  async findDecisionByIdempotencyKey(idempotencyKey: string): Promise<Decision | undefined> {
    const row = await this.decisions.findOne({ where: { idempotencyKey } });
    return row === null ? undefined : toDomainDecision(row);
  }

  async listApprovals(filter?: ApprovalListFilter): Promise<ApprovalRequest[]> {
    const where: Record<string, unknown> = {};
    if (filter?.status) where.status = filter.status;
    if (filter?.leadId) where.leadId = filter.leadId;
    if (filter?.creatorId) where.creatorId = filter.creatorId;
    if (filter?.currentApproverId) where.currentApproverId = filter.currentApproverId;
    const rows = await this.approvals.find({
      where: Object.keys(where).length ? where : undefined,
      order: { submittedAt: 'DESC' },
    });
    return rows.map(toDomainApproval);
  }

  async listDecisions(): Promise<Decision[]> {
    const rows = await this.decisions.find({ order: { decidedAt: 'DESC' } });
    return rows.map(toDomainDecision);
  }

  async listHistory(approvalId: string): Promise<ApprovalHistoryEvent[]> {
    const rows = await this.history.find({
      where: { approvalId },
      order: { timestamp: 'ASC' },
    });
    return rows.map(toDomainHistory);
  }

  async appendHistory(event: ApprovalHistoryEvent): Promise<void> {
    const existing = await this.history.findOne({
      where: { approvalId: event.approvalId, idempotencyKey: event.idempotencyKey },
    });
    if (existing !== null) {
      return;
    }
    await this.history.save(toEntityHistory(event));
  }
}