import { SubmitApprovalInput } from '../dto/approval.dto';
import { ActorRole } from '../shared/roles';
import { MockActor, MockActorScope } from './actor.types';
import { ApproverMapping } from './approver-assignment.repository';

export const MOCK_ACTOR_IDS = {
  salesRep: 'actor-sales-rep',
  salesManager: 'actor-sales-manager',
  pnlHead: 'actor-pnl-head',
  admin: 'actor-admin',
} as const;

export const MOCK_LEAD_IDS = {
  demo: 'lead-demo-001',
  test: 'lead-1',
} as const;

export const MOCK_SUBMIT_BASE = {
  teamId: 'team-1',
  territoryId: 'territory-1',
  productVertical: 'UPI',
} as const;

const MOCK_UPI_SCOPE: MockActorScope = {
  teamId: MOCK_SUBMIT_BASE.teamId,
  territoryId: MOCK_SUBMIT_BASE.territoryId,
  productVertical: MOCK_SUBMIT_BASE.productVertical,
};

const MOCK_BBPS_SCOPE: MockActorScope = {
  teamId: MOCK_SUBMIT_BASE.teamId,
  territoryId: MOCK_SUBMIT_BASE.territoryId,
  productVertical: 'BBPS',
};

export const MOCK_ACTOR_SCOPES: Readonly<Record<string, readonly MockActorScope[]>> = {
  [MOCK_ACTOR_IDS.salesRep]: [MOCK_UPI_SCOPE],
  [MOCK_ACTOR_IDS.salesManager]: [MOCK_UPI_SCOPE],
  [MOCK_ACTOR_IDS.pnlHead]: [MOCK_UPI_SCOPE, MOCK_BBPS_SCOPE],
  [MOCK_ACTOR_IDS.admin]: [],
};

export const MOCK_ACTORS: readonly MockActor[] = [
  {
    actorId: MOCK_ACTOR_IDS.salesRep,
    role: 'SALES_REPRESENTATIVE',
    scopes: MOCK_ACTOR_SCOPES[MOCK_ACTOR_IDS.salesRep],
  },
  {
    actorId: MOCK_ACTOR_IDS.salesManager,
    role: 'SALES_MANAGER',
    scopes: MOCK_ACTOR_SCOPES[MOCK_ACTOR_IDS.salesManager],
  },
  {
    actorId: MOCK_ACTOR_IDS.pnlHead,
    role: 'PNL_HEAD',
    scopes: MOCK_ACTOR_SCOPES[MOCK_ACTOR_IDS.pnlHead],
  },
  {
    actorId: MOCK_ACTOR_IDS.admin,
    role: 'ADMIN',
    scopes: MOCK_ACTOR_SCOPES[MOCK_ACTOR_IDS.admin],
  },
];

export const MOCK_APPROVER_MAPPINGS: Readonly<Record<string, ApproverMapping>> = {
  UPI: { pnlHeadId: MOCK_ACTOR_IDS.pnlHead, salesManagerId: MOCK_ACTOR_IDS.salesManager },
  BBPS: { pnlHeadId: MOCK_ACTOR_IDS.pnlHead, salesManagerId: MOCK_ACTOR_IDS.salesManager },
  default: { pnlHeadId: MOCK_ACTOR_IDS.pnlHead, salesManagerId: MOCK_ACTOR_IDS.salesManager },
};

export interface SubmitApprovalInputOverrides {
  leadId?: string;
  creatorId?: string;
  creatorRole?: ActorRole;
  productVertical?: string;
  teamId?: string;
  territoryId?: string;
  idempotencyKey?: string;
}

export function buildSubmitApprovalInput(
  overrides: SubmitApprovalInputOverrides = {},
): SubmitApprovalInput {
  return {
    leadId: overrides.leadId ?? MOCK_LEAD_IDS.test,
    creatorId: overrides.creatorId ?? MOCK_ACTOR_IDS.salesRep,
    creatorRole: overrides.creatorRole ?? 'SALES_REPRESENTATIVE',
    productVertical: overrides.productVertical ?? MOCK_SUBMIT_BASE.productVertical,
    teamId: overrides.teamId ?? MOCK_SUBMIT_BASE.teamId,
    territoryId: overrides.territoryId ?? MOCK_SUBMIT_BASE.territoryId,
    idempotencyKey: overrides.idempotencyKey ?? 'submit-1',
  };
}

export const MOCK_SAMPLE_SUBMIT: SubmitApprovalInput = buildSubmitApprovalInput({
  leadId: MOCK_LEAD_IDS.demo,
  teamId: 'team-demo',
  territoryId: 'territory-demo',
  idempotencyKey: 'submit-lead-demo-001-v1',
});

export function mockActor(actorId: string, role: ActorRole): MockActor {
  return {
    actorId,
    role,
    scopes: MOCK_ACTOR_SCOPES[actorId] ?? [MOCK_UPI_SCOPE],
  };
}