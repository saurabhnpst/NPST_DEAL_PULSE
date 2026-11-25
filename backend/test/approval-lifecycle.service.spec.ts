import { ExecutionContext } from '@nestjs/common';
import { ApprovalLifecycleService } from '../apps/approval-service/src/approvals/approval-lifecycle.service';
import { InMemoryApprovalRepository } from '../apps/approval-service/src/approvals/in-memory-approval.repository';
import { ApprovalsController } from '../apps/approval-service/src/approvals/approvals.controller';
import { DecisionsController } from '../apps/approval-service/src/decisions/decisions.controller';
import {
  SubmitApprovalInput,
  parseApproveApprovalInput,
  parseRejectApprovalInput,
} from '../apps/approval-service/src/dto/approval.dto';
import { ActorContextRequest, MockActor } from '../apps/approval-service/src/mock/actor.types';
import {
  MOCK_ACTOR_IDS,
  MOCK_SUBMIT_BASE,
  buildSubmitApprovalInput,
  mockActor,
} from '../apps/approval-service/src/mock/fixtures';
import { MockApprovalPolicy } from '../apps/approval-service/src/mock/mock-approval-policy';
import { MockActorGuard } from '../apps/approval-service/src/mock/mock-actor.guard';
import { MockDirectory } from '../apps/approval-service/src/mock/mock-directory';
import { MockTokenCodec } from '../apps/approval-service/src/mock/mock-token.codec';
import { Clock } from '../apps/approval-service/src/shared/clock';
import { ApprovalConfigService } from '../apps/approval-service/src/shared/config';
import { DomainError } from '../apps/approval-service/src/shared/errors';
import { InMemoryApprovalEventPublisher } from '../apps/approval-service/src/shared/event-publisher';
import { ActorRole } from '../apps/approval-service/src/shared/roles';

declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void | Promise<void>): void;
declare function afterEach(fn: () => void): void;

class TestClock implements Clock {
  current: Date;

  constructor(value: string) {
    this.current = new Date(value);
  }

  now(): Date {
    return new Date(this.current.getTime());
  }

  set(value: string): void {
    this.current = new Date(value);
  }

  advance(milliseconds: number): void {
    this.current = new Date(this.current.getTime() + milliseconds);
  }
}

function assertEqual<T>(actual: T, expected: T, label = 'value'): void {
  if (actual !== expected) {
    throw new Error(`${label}: expected ${String(expected)}, got ${String(actual)}`);
  }
}

function assertTrue(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(message);
  }
}

function assertLength<T>(items: readonly T[], expected: number, label = 'items'): void {
  if (items.length !== expected) {
    throw new Error(`${label}: expected ${expected}, got ${items.length}`);
  }
}

function assertContains<T>(items: readonly T[], expected: T, label = 'items'): void {
  if (!items.includes(expected)) {
    throw new Error(`${label}: missing ${String(expected)}`);
  }
}

function guardContext(headers: Record<string, string | string[] | undefined>) {
  const request: ActorContextRequest = { headers };
  const context = {
    switchToHttp: () => ({ getRequest: () => request }),
  } as unknown as ExecutionContext;
  return { context, request };
}

interface HarnessOptions {
  creatorId?: string;
  creatorRole?: ActorRole;
  pnlHeadId?: string;
  salesManagerId?: string;
}

function createHarness(options: HarnessOptions = {}) {
  process.env['APPROVAL_ESCALATION_MS'] = '1000';
  process.env['APPROVAL_ESCALATION_ENABLED'] = 'true';
  delete process.env['APPROVAL_ESCALATION_APPROVED'];
  delete process.env['NODE_ENV'];
  const repository = new InMemoryApprovalRepository();
  const directory = new MockDirectory();
  const clock = new TestClock('2026-01-01T00:00:00.000Z');
  const config = new ApprovalConfigService();
  const events = new InMemoryApprovalEventPublisher();
  const creatorId = options.creatorId ?? MOCK_ACTOR_IDS.salesRep;
  const creatorRole = options.creatorRole ?? 'SALES_REPRESENTATIVE';
  directory.addActor(mockActor(creatorId, creatorRole));
  if (options.pnlHeadId !== undefined || options.salesManagerId !== undefined) {
    directory.setMapping(MOCK_SUBMIT_BASE.productVertical, {
      pnlHeadId: options.pnlHeadId ?? MOCK_ACTOR_IDS.pnlHead,
      salesManagerId: options.salesManagerId ?? MOCK_ACTOR_IDS.salesManager,
    });
  }
  const service = new ApprovalLifecycleService(
    repository,
    directory,
    clock,
    config,
    events,
    new MockApprovalPolicy(),
  );
  const input: SubmitApprovalInput = buildSubmitApprovalInput({ creatorId, creatorRole });
  return {
    repository,
    directory,
    clock,
    config,
    events,
    service,
    input,
    pnlActor: mockActor(options.pnlHeadId ?? MOCK_ACTOR_IDS.pnlHead, 'PNL_HEAD'),
    managerActor: mockActor(MOCK_ACTOR_IDS.salesManager, 'SALES_MANAGER'),
    creatorActor: mockActor(creatorId, creatorRole),
  };
}

async function expectDomainError(
  operation: Promise<unknown>,
  code: string,
  httpStatus: number,
): Promise<void> {
  try {
    await operation;
    throw new Error('Expected domain error');
  } catch (error: unknown) {
    assertTrue(error instanceof DomainError, 'Expected DomainError');
    if (error instanceof DomainError) {
      assertEqual(error.code, code, 'error code');
      assertEqual(error.httpStatus, httpStatus, 'http status');
    }
  }
}

afterEach(() => {
  delete process.env['APPROVAL_ESCALATION_MS'];
  delete process.env['APPROVAL_ESCALATION_ENABLED'];
  delete process.env['APPROVAL_ESCALATION_APPROVED'];
  delete process.env['APPROVAL_MOCK_TOKEN_SECRET'];
  delete process.env['NODE_ENV'];
});

describe('approval lifecycle', () => {
  it('creates approval with P&L Head authority and submission timer', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    assertEqual(approval.status, 'PENDING_PNL_HEAD', 'status');
    assertEqual(approval.currentAuthorityRole, 'PNL_HEAD', 'authority');
    assertEqual(approval.currentApproverId, MOCK_ACTOR_IDS.pnlHead, 'approver');
    assertEqual(Date.parse(approval.expiresAt) - Date.parse(approval.submittedAt), 1000, 'window');
  });

  it('rejects missing approver mapping with controlled 422', async () => {
    const harness = createHarness();
    harness.directory.setMapping('UPI', { pnlHeadId: '', salesManagerId: '' });
    await expectDomainError(harness.service.submit(harness.input), 'MAPPING_MISSING', 422);
  });

  it('returns existing approval for repeated submission key', async () => {
    const harness = createHarness();
    const first = await harness.service.submit(harness.input);
    const second = await harness.service.submit({ ...harness.input, leadId: 'lead-2' });
    assertEqual(second.id, first.id, 'approval id');
  });

  it('rejects second active approval for same lead', async () => {
    const harness = createHarness();
    await harness.service.submit(harness.input);
    await expectDomainError(
      harness.service.submit({ ...harness.input, idempotencyKey: 'submit-2' }),
      'CONFLICT',
      409,
    );
  });

  it('allows new request after rejection and preserves prior history', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    await harness.service.reject(
      approval.id,
      harness.pnlActor,
      { reason: 'Insufficient detail' },
      'reject-1',
    );
    const resubmitted = await harness.service.submit({
      ...harness.input,
      idempotencyKey: 'submit-2',
    });
    assertTrue(resubmitted.id !== approval.id, 'new request id expected');
    const history = await harness.service.getHistory(approval.id, harness.pnlActor);
    assertContains(
      history.map((item) => item.type),
      'REJECTED',
      'history types',
    );
  });

  it('blocks Sales Manager creator self-approval after transfer and records audit', async () => {
    const harness = createHarness({
      creatorId: MOCK_ACTOR_IDS.salesManager,
      creatorRole: 'SALES_MANAGER',
      salesManagerId: MOCK_ACTOR_IDS.salesManager,
    });
    const approval = await harness.service.submit(harness.input);
    harness.clock.advance(1001);
    await expectDomainError(
      harness.service.approve(approval.id, harness.managerActor, {}, 'approve-self'),
      'SELF_APPROVAL',
      409,
    );
    const current = await harness.repository.findById(approval.id);
    const history = await harness.repository.listHistory(approval.id);
    assertEqual(current?.status, 'PENDING_SALES_MANAGER', 'status');
    assertTrue(history.some((item) => item.type === 'DECISION_BLOCKED'), 'audit event expected');
  });

  it('scopes reads to current approver and creator', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    await expectDomainError(
      harness.service.getApproval(approval.id, {
        actorId: 'actor-other',
        role: 'SALES_REPRESENTATIVE',
      }),
      'FORBIDDEN',
      403,
    );
    const visible = await harness.service.getApproval(approval.id, harness.creatorActor);
    assertEqual(visible.id, approval.id, 'visible approval');
  });

  it('rejects action by non-current approver', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    await expectDomainError(
      harness.service.approve(approval.id, harness.creatorActor, {}, 'approve-1'),
      'FORBIDDEN',
      403,
    );
  });

  it('transfers authority at exact expiry boundary', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    harness.clock.set(new Date(Date.parse(approval.expiresAt)).toISOString());
    const current = await harness.service.getApproval(approval.id, harness.managerActor);
    assertEqual(current.currentAuthorityRole, 'SALES_MANAGER', 'authority');
    assertEqual(current.currentApproverId, MOCK_ACTOR_IDS.salesManager, 'approver');
  });

  it('handles simultaneous escalation and stale approver action', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    harness.clock.advance(1001);
    const results = await Promise.allSettled([
      harness.service.getApproval(approval.id, harness.managerActor),
      harness.service.approve(approval.id, harness.pnlActor, {}, 'approve-race'),
    ]);
    assertEqual(results[0]?.status, 'fulfilled', 'escalation result');
    assertEqual(results[1]?.status, 'rejected', 'stale action result');
    const decision = await harness.repository.findDecisionByApprovalId(approval.id);
    assertTrue(decision === undefined, 'no decision expected');
  });

  it('does not duplicate transfer history on repeated escalation', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    harness.clock.advance(1001);
    await harness.service.escalateAllDue();
    await harness.service.escalateAllDue();
    const transfers = (await harness.repository.listHistory(approval.id)).filter(
      (item) => item.type === 'AUTHORITY_TRANSFERRED',
    );
    assertLength(transfers, 1, 'transfer events');
  });

  it('returns same decision for repeated idempotent approve', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    const first = await harness.service.approve(approval.id, harness.pnlActor, {}, 'decision-1');
    const second = await harness.service.approve(approval.id, harness.pnlActor, {}, 'decision-1');
    assertEqual(second.id, first.id, 'decision id');
    assertLength(await harness.repository.listDecisions(), 1, 'decisions');
  });

  it('uses one decision state for approve and proceed alias', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    const approved = await harness.service.approve(approval.id, harness.pnlActor, {}, 'alias-1');
    const proceeded = await harness.service.approve(approval.id, harness.pnlActor, {}, 'alias-1');
    assertEqual(proceeded.id, approved.id, 'alias decision id');
    assertEqual((await harness.repository.findById(approval.id))?.status, 'APPROVED', 'status');
    assertLength(await harness.repository.listDecisions(), 1, 'decisions');
  });

  it('requires rejection reason and allows optional approval comment', () => {
    let rejectionFailed = false;
    try {
      parseRejectApprovalInput({});
    } catch (error: unknown) {
      rejectionFailed = error instanceof DomainError;
    }
    assertTrue(rejectionFailed, 'missing reason must fail');
    const empty = parseApproveApprovalInput({});
    assertTrue(Object.keys(empty).length === 0, 'comment optional');
    assertEqual(parseApproveApprovalInput({ comment: 'ok' }).comment, 'ok', 'comment');
  });

  it('returns 501 for deferred endpoints', () => {
    const stub = {} as ApprovalLifecycleService;
    const approvals = new ApprovalsController(stub);
    const decisions = new DecisionsController(stub);
    let approvalsFailed = false;
    let decisionsFailed = false;
    try {
      approvals.requestChanges();
    } catch (error: unknown) {
      approvalsFailed = error instanceof DomainError && error.httpStatus === 501;
    }
    try {
      decisions.recommendation();
    } catch (error: unknown) {
      decisionsFailed = error instanceof DomainError && error.httpStatus === 501;
    }
    assertTrue(approvalsFailed, 'request-changes 501');
    assertTrue(decisionsFailed, 'recommendation 501');
  });

  it('scopes decision reads to actors linked to approval', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    const decision = await harness.service.approve(
      approval.id,
      harness.pnlActor,
      {},
      'decision-read-1',
    );
    const visible = await harness.service.getDecision(decision.id, harness.creatorActor);
    assertEqual(visible.id, decision.id, 'decision id');
    await expectDomainError(
      harness.service.getDecision(decision.id, {
        actorId: 'actor-other',
        role: 'SALES_REPRESENTATIVE',
      }),
      'FORBIDDEN',
      403,
    );
  });

  it('does not reopen decided approval after expiry', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    await harness.service.approve(approval.id, harness.pnlActor, {}, 'decided-1');
    harness.clock.advance(1001);
    const current = await harness.service.getApproval(approval.id, harness.creatorActor);
    assertEqual(current.status, 'APPROVED', 'status');
    assertEqual(await harness.service.escalateAllDue(), 0, 'escalation count');
    const transfers = (await harness.repository.listHistory(approval.id)).filter(
      (item) => item.type === 'AUTHORITY_TRANSFERRED',
    );
    assertLength(transfers, 0, 'transfer events');
  });

  it('enforces single active approval under concurrent submit', async () => {
    const harness = createHarness();
    const results = await Promise.allSettled([
      harness.service.submit(harness.input),
      harness.service.submit({ ...harness.input, idempotencyKey: 'submit-concurrent' }),
    ]);
    assertEqual(results[0]?.status, 'fulfilled', 'first submit');
    assertEqual(results[1]?.status, 'rejected', 'second submit');
    const reason: unknown = results[1]?.status === 'rejected' ? results[1].reason : undefined;
    assertTrue(reason instanceof DomainError, 'DomainError expected');
    if (reason instanceof DomainError) {
      assertEqual(reason.code, 'CONFLICT', 'error code');
    }
  });

  it('scopes decision idempotency by approval', async () => {
    const harness = createHarness();
    const first = await harness.service.submit(harness.input);
    const second = await harness.service.submit({
      ...harness.input,
      leadId: 'lead-other',
      idempotencyKey: 'submit-other',
    });
    const firstDecision = await harness.service.approve(
      first.id,
      harness.pnlActor,
      {},
      'shared-key',
    );
    const secondDecision = await harness.service.approve(
      second.id,
      harness.pnlActor,
      {},
      'shared-key',
    );
    assertTrue(firstDecision.id !== secondDecision.id, 'distinct decisions expected');
    assertLength(await harness.repository.listDecisions(), 2, 'decisions');
  });

  it('scopes decision idempotency by actor', async () => {
    const harness = createHarness();
    const first = await harness.service.submit(harness.input);
    harness.directory.setMapping(MOCK_SUBMIT_BASE.productVertical, {
      pnlHeadId: 'actor-pnl-head-alt',
      salesManagerId: MOCK_ACTOR_IDS.salesManager,
    });
    const second = await harness.service.submit({
      ...harness.input,
      leadId: 'lead-alt',
      idempotencyKey: 'submit-alt',
    });
    const firstDecision = await harness.service.approve(
      first.id,
      harness.pnlActor,
      {},
      'shared-key',
    );
    const secondDecision = await harness.service.approve(
      second.id,
      mockActor('actor-pnl-head-alt', 'PNL_HEAD'),
      {},
      'shared-key',
    );
    assertTrue(firstDecision.id !== secondDecision.id, 'distinct decisions expected');
  });

  it('keeps first valid decision when key is reused with other outcome', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    const approved = await harness.service.approve(approval.id, harness.pnlActor, {}, 'first-wins');
    const repeated = await harness.service.reject(
      approval.id,
      harness.pnlActor,
      { reason: 'Late rejection' },
      'first-wins',
    );
    assertEqual(repeated.id, approved.id, 'decision id');
    assertEqual(repeated.outcome, 'APPROVED', 'outcome');
  });

  it('rejects missing, invalid and unknown mock actor tokens', async () => {
    const config = new ApprovalConfigService();
    const codec = new MockTokenCodec(config);
    const directory = new MockDirectory();
    const guard = new MockActorGuard(codec, directory);
    const missing = guardContext({});
    await expectDomainError(
      Promise.resolve().then(() => guard.canActivate(missing.context)),
      'FORBIDDEN',
      403,
    );
    const invalid = guardContext({ 'x-mock-token': 'not-a-token' });
    await expectDomainError(
      Promise.resolve().then(() => guard.canActivate(invalid.context)),
      'FORBIDDEN',
      403,
    );
    const valid = guardContext({ 'x-mock-token': codec.sign(MOCK_ACTOR_IDS.pnlHead) });
    assertTrue(guard.canActivate(valid.context), 'valid token accepted');
    assertEqual(valid.request.actor?.actorId, MOCK_ACTOR_IDS.pnlHead, 'actor id');
    const unknown = guardContext({ 'x-mock-token': codec.sign('actor-unknown') });
    await expectDomainError(
      Promise.resolve().then(() => guard.canActivate(unknown.context)),
      'FORBIDDEN',
      403,
    );
  });

  it('scopes lists, pending queues and history by policy', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    const outsider: MockActor = { actorId: 'actor-other', role: 'SALES_REPRESENTATIVE' };
    assertLength(await harness.service.listApprovals(outsider), 0, 'outsider list');
    assertLength(await harness.service.pendingApprovals(outsider), 0, 'outsider pending');
    assertLength(await harness.service.pendingDecisions(outsider), 0, 'outsider decisions');
    await expectDomainError(
      harness.service.getHistory(approval.id, outsider),
      'FORBIDDEN',
      403,
    );
    assertLength(await harness.service.listApprovals(harness.creatorActor), 1, 'creator list');
    assertLength(await harness.service.pendingApprovals(harness.pnlActor), 1, 'pnl pending');
    assertLength(await harness.service.pendingDecisions(harness.pnlActor), 1, 'pnl decisions');
    assertLength(await harness.service.getHistory(approval.id, harness.creatorActor), 1, 'history');
    harness.clock.advance(1001);
    assertLength(await harness.service.pendingApprovals(harness.managerActor), 1, 'manager pending');
  });

  it('denies decisions outside actor scope and resource grants', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    const wrongScope: MockActor = {
      actorId: MOCK_ACTOR_IDS.pnlHead,
      role: 'PNL_HEAD',
      scopes: [{ teamId: 'other', territoryId: 'other', productVertical: 'OTHER' }],
    };
    await expectDomainError(
      harness.service.approve(approval.id, wrongScope, {}, 'scope-denied'),
      'FORBIDDEN',
      403,
    );
    const policy = new MockApprovalPolicy();
    const withDocument = { ...approval, documentIds: ['doc-1'] };
    assertTrue(!policy.canDecide(harness.pnlActor, withDocument), 'document grant required');
  });

  it('publishes versioned event envelopes without sensitive payload', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    await harness.service.approve(
      approval.id,
      harness.pnlActor,
      { comment: 'sensitive commercial detail' },
      'events-1',
    );
    assertLength(harness.events.events, 2, 'events');
    for (const event of harness.events.events) {
      assertEqual(event.schemaVersion, '1.0', 'schema version');
      assertEqual(event.producer, 'approval-service', 'producer');
      assertEqual(event.correlationId, approval.id, 'correlation id');
      assertTrue(!JSON.stringify(event.payload).includes('sensitive'), 'no sensitive payload');
    }
  });

  it('requires explicit escalation opt-in and production approval', async () => {
    delete process.env['APPROVAL_ESCALATION_ENABLED'];
    assertEqual(new ApprovalConfigService().escalationEnabled, false, 'default disabled');
    process.env['APPROVAL_ESCALATION_ENABLED'] = 'true';
    assertEqual(new ApprovalConfigService().escalationEnabled, true, 'explicit enabled');
    process.env['NODE_ENV'] = 'production';
    delete process.env['APPROVAL_ESCALATION_APPROVED'];
    delete process.env['APPROVAL_ESCALATION_MS'];
    let failed = false;
    try {
      new ApprovalConfigService();
    } catch (error: unknown) {
      failed = error instanceof DomainError && error.code === 'CONFIGURATION_ERROR';
    }
    assertTrue(failed, 'production escalation requires approval');
  });

  it('uses decisions proceed controller for approve alias', async () => {
    const harness = createHarness();
    const approval = await harness.service.submit(harness.input);
    const controller = new DecisionsController(harness.service);
    const request = { headers: { 'idempotency-key': 'controller-alias' } };
    const first = await controller.proceed(approval.id, harness.pnlActor, {}, request);
    const repeated = await controller.proceed(approval.id, harness.pnlActor, {}, request);
    assertEqual(repeated.id, first.id, 'alias decision id');
  });

  it('rejects blank and non-object request bodies', async () => {
    await expectDomainError(
      Promise.resolve().then(() => parseRejectApprovalInput({ reason: '   ' })),
      'VALIDATION_ERROR',
      400,
    );
    await expectDomainError(
      Promise.resolve().then(() => parseApproveApprovalInput('bad')),
      'VALIDATION_ERROR',
      400,
    );
  });
});

describe('mock actor token', () => {
  it('verifies signed token and rejects tampering', () => {
    const config = new ApprovalConfigService();
    const codec = new MockTokenCodec(config);
    const token = codec.sign(MOCK_ACTOR_IDS.pnlHead);
    assertEqual(codec.verify(token).actorId, MOCK_ACTOR_IDS.pnlHead, 'token actor');
    let rejectionFailed = false;
    try {
      codec.verify(`${token.slice(0, -1)}x`);
    } catch (error: unknown) {
      rejectionFailed = error instanceof DomainError;
    }
    assertTrue(rejectionFailed, 'tampered token rejected');
  });
});
