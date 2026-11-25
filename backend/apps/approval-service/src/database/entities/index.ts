import { ApprovalHistoryEventEntity } from './approval-history-event.entity';
import { ApprovalRequestEntity } from './approval-request.entity';
import { DecisionEntity } from './decision.entity';

export const APPROVAL_ENTITIES = [
  ApprovalRequestEntity,
  DecisionEntity,
  ApprovalHistoryEventEntity,
];

export { ApprovalRequestEntity, DecisionEntity, ApprovalHistoryEventEntity };