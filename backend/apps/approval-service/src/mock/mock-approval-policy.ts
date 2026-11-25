import { ApprovalRequest } from '../approvals/approval.types';
import { ApprovalPolicy } from '../shared/approval-policy';
import { MockActor } from './actor.types';

export class MockApprovalPolicy implements ApprovalPolicy {
  canRead(actor: MockActor, approval: ApprovalRequest): boolean {
    if (!this.hasScope(actor, approval) || !this.hasResourceGrants(actor, approval)) {
      return false;
    }
    return (
      actor.role === 'ADMIN' ||
      actor.actorId === approval.creatorId ||
      actor.actorId === approval.currentApproverId
    );
  }

  canDecide(actor: MockActor, approval: ApprovalRequest): boolean {
    if (actor.role !== 'PNL_HEAD' && actor.role !== 'SALES_MANAGER') {
      return false;
    }
    return (
      actor.actorId === approval.currentApproverId &&
      this.hasScope(actor, approval) &&
      this.hasResourceGrants(actor, approval)
    );
  }

  private hasScope(actor: MockActor, approval: ApprovalRequest): boolean {
    if (actor.role === 'ADMIN') {
      return true;
    }
    return (
      actor.scopes?.some(
        (scope) =>
          scope.teamId === approval.teamId &&
          scope.territoryId === approval.territoryId &&
          scope.productVertical === approval.productVertical,
      ) === true
    );
  }

  private hasResourceGrants(actor: MockActor, approval: ApprovalRequest): boolean {
    if (actor.role === 'ADMIN') {
      return true;
    }
    const taskIds = approval.taskIds ?? [];
    const documentIds = approval.documentIds ?? [];
    return (
      taskIds.every((id) => actor.taskIds?.includes(id) === true) &&
      documentIds.every((id) => actor.documentIds?.includes(id) === true)
    );
  }
}
