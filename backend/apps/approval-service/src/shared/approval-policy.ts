import { ApprovalRequest } from '../approvals/approval.types';
import { MockActor } from '../mock/actor.types';

export const APPROVAL_POLICY = Symbol('APPROVAL_POLICY');

export interface ApprovalPolicy {
  canRead(actor: MockActor, approval: ApprovalRequest): boolean;
  canDecide(actor: MockActor, approval: ApprovalRequest): boolean;
}
