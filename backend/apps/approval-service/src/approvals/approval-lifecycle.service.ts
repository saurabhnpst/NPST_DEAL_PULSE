import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { ApproveApprovalInput, RejectApprovalInput, SubmitApprovalInput } from '../dto/approval.dto';
import { APPROVAL_REPOSITORY, ApprovalRepository } from './approval.repository';
import {
  ACTIVE_APPROVAL_STATUSES,
  ApprovalHistoryEvent,
  ApprovalHistoryType,
  ApprovalRequest,
} from './approval.types';
import { Decision, PendingDecisionView } from '../decisions/decision.types';
import { MockActor } from '../mock/actor.types';
import {
  ASSIGNMENT_REPOSITORY,
  ApproverAssignmentRepository,
  ApproverMapping,
} from '../mock/approver-assignment.repository';
import { CLOCK, Clock } from '../shared/clock';
import { APPROVAL_POLICY, ApprovalPolicy } from '../shared/approval-policy';
import { ApprovalConfigService } from '../shared/config';
import {
  conflictError,
  forbiddenError,
  mappingMissingError,
  notFoundError,
} from '../shared/errors';
import { APPROVAL_EVENTS, ApprovalEventPublisher } from '../shared/event-publisher';
import { SYSTEM_ACTOR_ID } from '../shared/roles';

interface TransitionInput {
  approvalId: string;
  actor: MockActor;
  outcome: 'APPROVED' | 'REJECTED';
  idempotencyKey: string;
  comment?: string;
  reason?: string;
}

@Injectable()
export class ApprovalLifecycleService {
  constructor(
    @Inject(APPROVAL_REPOSITORY) private readonly repository: ApprovalRepository,
    @Inject(ASSIGNMENT_REPOSITORY) private readonly assignments: ApproverAssignmentRepository,
    @Inject(CLOCK) private readonly clock: Clock,
    private readonly config: ApprovalConfigService,
    @Inject(APPROVAL_EVENTS) private readonly events: ApprovalEventPublisher,
    @Inject(APPROVAL_POLICY) private readonly policy: ApprovalPolicy,
  ) {}

  async submit(input: SubmitApprovalInput): Promise<ApprovalRequest> {
    const existing = await this.repository.findBySubmissionKey(input.idempotencyKey);
    if (existing !== undefined) {
      return existing;
    }
    const active = await this.repository.findActiveByLeadId(input.leadId);
    if (active !== undefined) {
      throw conflictError('Active approval already exists for lead');
    }
    const mapping = await this.requireMapping(input.productVertical);
    await this.assignments.saveLeadAssignment({
      leadId: input.leadId,
      creatorId: input.creatorId,
      productVertical: input.productVertical,
      teamId: input.teamId,
      territoryId: input.territoryId,
    });
    return this.createApproval(input, mapping.pnlHeadId, mapping.salesManagerId);
  }

  async listApprovals(actor: MockActor): Promise<ApprovalRequest[]> {
    const approvals = await this.repository.listApprovals();
    const current = await Promise.all(approvals.map((item) => this.applyDueEscalation(item)));
    return current.filter((item) => this.canRead(item, actor));
  }

  async getApproval(id: string, actor: MockActor): Promise<ApprovalRequest> {
    const approval = await this.findWithEscalation(id);
    this.assertReadAccess(approval, actor);
    return approval;
  }

  async getHistory(id: string, actor: MockActor): Promise<ApprovalHistoryEvent[]> {
    await this.getApproval(id, actor);
    return this.repository.listHistory(id);
  }

  async approve(
    id: string,
    actor: MockActor,
    input: ApproveApprovalInput,
    idempotencyKey: string,
  ): Promise<Decision> {
    return this.transition({
      approvalId: id,
      actor,
      outcome: 'APPROVED',
      idempotencyKey,
      comment: input.comment,
    });
  }

  async reject(
    id: string,
    actor: MockActor,
    input: RejectApprovalInput,
    idempotencyKey: string,
  ): Promise<Decision> {
    return this.transition({
      approvalId: id,
      actor,
      outcome: 'REJECTED',
      idempotencyKey,
      reason: input.reason,
    });
  }

  async pendingApprovals(actor: MockActor): Promise<ApprovalRequest[]> {
    const approvals = await this.listApprovals(actor);
    return approvals.filter(
      (item) =>
        ACTIVE_APPROVAL_STATUSES.includes(item.status) && item.currentApproverId === actor.actorId,
    );
  }

  async listDecisions(actor: MockActor): Promise<Decision[]> {
    const decisions = await this.repository.listDecisions();
    const visible: Decision[] = [];
    for (const decision of decisions) {
      const approval = await this.repository.findById(decision.approvalId);
      if (approval !== undefined && this.canRead(approval, actor)) {
        visible.push(decision);
      }
    }
    return visible;
  }

  async getDecision(id: string, actor: MockActor): Promise<Decision> {
    const decision = await this.repository.findDecisionById(id);
    if (decision === undefined) {
      throw notFoundError('Decision not found');
    }
    const approval = await this.repository.findById(decision.approvalId);
    if (approval === undefined) {
      throw notFoundError('Approval not found');
    }
    this.assertReadAccess(approval, actor);
    return decision;
  }

  async pendingDecisions(actor: MockActor): Promise<PendingDecisionView[]> {
    const approvals = await this.listApprovals(actor);
    return approvals
      .filter(
        (item) =>
          ACTIVE_APPROVAL_STATUSES.includes(item.status) && item.currentApproverId === actor.actorId,
      )
      .map((item) => this.toPendingDecision(item));
  }

  async escalateAllDue(): Promise<number> {
    if (!this.config.escalationEnabled) {
      return 0;
    }
    const approvals = await this.repository.listApprovals();
    const results = await Promise.all(approvals.map((item) => this.applyDueEscalation(item)));
    return results.filter((item, index) => item.version !== approvals[index]?.version).length;
  }

  private async createApproval(
    input: SubmitApprovalInput,
    pnlHeadId: string,
    salesManagerId: string,
  ): Promise<ApprovalRequest> {
    const now = this.clock.now();
    const approval: ApprovalRequest = {
      id: randomUUID(),
      leadId: input.leadId,
      creatorId: input.creatorId,
      productVertical: input.productVertical,
      teamId: input.teamId,
      territoryId: input.territoryId,
      status: 'PENDING_PNL_HEAD',
      currentAuthorityRole: 'PNL_HEAD',
      currentApproverId: pnlHeadId,
      originalApproverId: pnlHeadId,
      submissionIdempotencyKey: input.idempotencyKey,
      expiresAt: new Date(now.getTime() + this.config.escalationWindowMs).toISOString(),
      submittedAt: now.toISOString(),
      updatedAt: now.toISOString(),
      version: 1,
    };
    const history = this.historyEvent(
      approval.id,
      'SUBMITTED',
      input.creatorId,
      input.creatorRole,
      input.idempotencyKey,
      now,
    );
    const stored = await this.repository.submit({ approval, history });
    await this.publish('approval.submitted.v1', stored, {
      creatorId: input.creatorId,
      productVertical: input.productVertical,
    });
    return stored;
  }

  private async transition(input: TransitionInput): Promise<Decision> {
    const scopedKey = this.decisionKey(input);
    const existing = await this.repository.findDecisionByIdempotencyKey(scopedKey);
    if (existing !== undefined) {
      if (existing.actorId !== input.actor.actorId) {
        throw forbiddenError('Decision belongs to another actor');
      }
      return existing;
    }
    const current = await this.findWithEscalation(input.approvalId);
    if (!ACTIVE_APPROVAL_STATUSES.includes(current.status)) {
      throw conflictError('Approval already decided');
    }
    await this.assertActionAccess(current, input.actor, scopedKey);
    return this.commitDecision(current, input, scopedKey);
  }

  private decisionKey(input: TransitionInput): string {
    return `${input.approvalId}:${input.actor.actorId}:${input.idempotencyKey}`;
  }

  private async commitDecision(
    approval: ApprovalRequest,
    input: TransitionInput,
    idempotencyKey: string,
  ): Promise<Decision> {
    const now = this.clock.now();
    const decision: Decision = {
      id: randomUUID(),
      approvalId: approval.id,
      outcome: input.outcome,
      actorId: input.actor.actorId,
      actorRole: input.actor.role,
      decidedAt: now.toISOString(),
      idempotencyKey,
      ...(input.comment === undefined ? {} : { comment: input.comment }),
      ...(input.reason === undefined ? {} : { reason: input.reason }),
    };
    const type: ApprovalHistoryType = decision.outcome === 'APPROVED' ? 'APPROVED' : 'REJECTED';
    const history = this.historyEvent(
      approval.id,
      type,
      input.actor.actorId,
      input.actor.role,
      decision.idempotencyKey,
      now,
      decision,
    );
    await this.repository.commitDecision({
      approvalId: approval.id,
      expectedVersion: approval.version,
      decision,
      history,
    });
    await this.publish('approval.decided.v1', approval, {
      decisionId: decision.id,
      actorId: input.actor.actorId,
      outcome: decision.outcome,
    });
    return decision;
  }

  private async applyDueEscalation(approval: ApprovalRequest): Promise<ApprovalRequest> {
    if (
      !ACTIVE_APPROVAL_STATUSES.includes(approval.status) ||
      !this.config.escalationEnabled ||
      approval.transferredAt !== undefined ||
      Date.parse(approval.expiresAt) > this.clock.now().getTime()
    ) {
      return approval;
    }
    const mapping = await this.requireMapping(approval.productVertical);
    const now = this.clock.now();
    const transferred: ApprovalRequest = {
      ...approval,
      status: 'PENDING_SALES_MANAGER',
      currentAuthorityRole: 'SALES_MANAGER',
      currentApproverId: mapping.salesManagerId,
      transferredAt: now.toISOString(),
      updatedAt: now.toISOString(),
    };
    const history = this.historyEvent(
      approval.id,
      'AUTHORITY_TRANSFERRED',
      SYSTEM_ACTOR_ID,
      'SYSTEM',
      `transfer:${approval.id}`,
      now,
      undefined,
      approval.currentApproverId,
      mapping.salesManagerId,
    );
    const result = await this.repository.commitTransfer({
      approvalId: approval.id,
      expectedVersion: approval.version,
      approval: transferred,
      history,
    });
    if (result.created) {
      await this.publish('approval.authority-transferred.v1', result.approval, {
        previousApproverId: approval.currentApproverId,
        newApproverId: mapping.salesManagerId,
      });
    }
    return result.approval;
  }

  private async findWithEscalation(id: string): Promise<ApprovalRequest> {
    const approval = await this.repository.findById(id);
    if (approval === undefined) {
      throw notFoundError('Approval not found');
    }
    return this.applyDueEscalation(approval);
  }

  private assertReadAccess(approval: ApprovalRequest, actor: MockActor): void {
    if (!this.policy.canRead(actor, approval)) {
      throw forbiddenError('Approval not accessible to actor');
    }
  }

  private async assertActionAccess(
    approval: ApprovalRequest,
    actor: MockActor,
    idempotencyKey: string,
  ): Promise<void> {
    if (approval.currentApproverId !== actor.actorId) {
      throw forbiddenError('Only current approver may decide');
    }
    if (!this.policy.canDecide(actor, approval)) {
      throw forbiddenError('Approval decision denied by policy');
    }
    if (
      approval.currentAuthorityRole === 'SALES_MANAGER' &&
      approval.creatorId === actor.actorId
    ) {
      await this.recordBlockedSelfApproval(approval, actor, idempotencyKey);
      throw conflictError('Sales Manager creator may not self-approve', 'SELF_APPROVAL');
    }
  }

  private async recordBlockedSelfApproval(
    approval: ApprovalRequest,
    actor: MockActor,
    idempotencyKey: string,
  ): Promise<void> {
    const now = this.clock.now();
    await this.repository.appendHistory({
      id: randomUUID(),
      approvalId: approval.id,
      type: 'DECISION_BLOCKED',
      actorId: actor.actorId,
      actorRole: actor.role,
      timestamp: now.toISOString(),
      idempotencyKey: `blocked:${approval.id}:${idempotencyKey}`,
      reason: 'Self-approval blocked',
    });
  }

  private canRead(approval: ApprovalRequest, actor: MockActor): boolean {
    return this.policy.canRead(actor, approval);
  }

  private historyEvent(
    approvalId: string,
    type: ApprovalHistoryType,
    actorId: string,
    actorRole: ApprovalHistoryEvent['actorRole'],
    idempotencyKey: string,
    timestamp: Date,
    decision?: Decision,
    previousApproverId?: string,
    newApproverId?: string,
  ): ApprovalHistoryEvent {
    return {
      id: randomUUID(),
      approvalId,
      type,
      actorId,
      actorRole,
      timestamp: timestamp.toISOString(),
      idempotencyKey,
      ...(decision?.comment === undefined ? {} : { comment: decision.comment }),
      ...(decision?.reason === undefined ? {} : { reason: decision.reason }),
      ...(previousApproverId === undefined ? {} : { previousApproverId }),
      ...(newApproverId === undefined ? {} : { newApproverId }),
    };
  }

  private async publish(
    eventType: string,
    approval: ApprovalRequest,
    extra: Record<string, string>,
  ): Promise<void> {
    await this.events.publish({
      eventId: randomUUID(),
      eventType,
      schemaVersion: '1.0',
      occurredAt: this.clock.now().toISOString(),
      producer: 'approval-service',
      correlationId: approval.id,
      payload: {
        approvalId: approval.id,
        leadId: approval.leadId,
        ...extra,
      },
    });
  }

  private toPendingDecision(approval: ApprovalRequest): PendingDecisionView {
    return {
      approvalId: approval.id,
      leadId: approval.leadId,
      status: approval.status,
      currentAuthorityRole: approval.currentAuthorityRole,
      expiresAt: approval.expiresAt,
      submittedAt: approval.submittedAt,
    };
  }

  private async requireMapping(productVertical: string): Promise<ApproverMapping> {
    const mapping = await this.assignments.getMapping(productVertical);
    if (mapping === undefined) {
      throw mappingMissingError(`No approver mapping for ${productVertical}`);
    }
    return mapping;
  }
}
