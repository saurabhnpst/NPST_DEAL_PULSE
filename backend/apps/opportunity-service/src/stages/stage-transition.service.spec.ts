import { BadRequestException } from '@nestjs/common';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityProduct } from '../entities/opportunity-product.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { toOpportunityResponse } from '../opportunities/opportunity.mapper';
import { StageValidationService } from './stage-validation.service';
import { StageTransitionService } from './stage-transition.service';

describe('StageTransitionService', () => {
  const makeOpp = (stage: string, extra: Partial<Opportunity> = {}): Opportunity =>
    ({
      id: '99',
      publicId: 'OPP-2026-00001',
      stage,
      name: 'Deal',
      ownerUserId: '1',
      accountName: 'Bank',
      closeDate: '2027-01-01',
      currency: 'INR',
      arr: '1000',
      oneTime: '100',
      compellingEvent: 'Renewal',
      recordType: 'TSP',
      reqReceived: 'Yes',
      demoDone: true,
      sow: 'Yes',
      proposalDate: '2026-11-01',
      earlyClose: false,
      products: [{ id: '1', productSlot: 1, productTsp: 'UPI', modules: ['TPAP'] } as OpportunityProduct],
      stageTasks: [],
      createdAt: new Date(),
      updatedAt: new Date(),
      deletedAt: null,
      ...extra,
    }) as unknown as Opportunity;

  /** Row returned by the locked SELECT inside the transaction. */
  let lockedRow: Opportunity;
  let saved: Opportunity | undefined;
  let historyRows: Record<string, unknown>[];
  let events: { publishInTransaction: jest.Mock };
  let opportunities: { findEntity: jest.Mock; findOne: jest.Mock };
  let service: StageTransitionService;

  const setup = (stage: string, extra: Partial<Opportunity> = {}) => {
    lockedRow = makeOpp(stage, extra);
    opportunities.findEntity.mockResolvedValue(makeOpp(stage, extra));
  };

  beforeEach(() => {
    saved = undefined;
    historyRows = [];
    events = { publishInTransaction: jest.fn() };
    opportunities = {
      findEntity: jest.fn(),
      findOne: jest.fn(async () => toOpportunityResponse(saved ?? lockedRow)),
    };
    const repo = { findOne: jest.fn(async () => lockedRow) };
    const dataSource = {
      transaction: jest.fn(async (fn) =>
        fn({
          getRepository: () => repo,
          create: (_entity: unknown, data: Record<string, unknown>) => data,
          save: async (row: Record<string, unknown>) => {
            if ('toStage' in row) historyRows.push(row);
            else saved = row as unknown as Opportunity;
            return row;
          },
        }),
      ),
    };
    service = new StageTransitionService(
      dataSource as never,
      opportunities as unknown as OpportunitiesService,
      new StageValidationService(),
      events as never,
    );
  });

  describe.each([
    ['Qualification', 'Needs Analysis'],
    ['Needs Analysis', 'Impact Analysis'],
    ['Impact Analysis', 'Proposal'],
    ['Proposal', 'Negotiation'],
  ] as const)('proceed %s → %s', (from, to) => {
    it('moves to the next stage and writes history + event', async () => {
      setup(from);
      const res = await service.proceed('OPP-2026-00001', from, 42);
      expect(res.stage).toBe(to);
      expect(saved?.lastModifiedByUserId).toBe('42');
      expect(historyRows[0]).toMatchObject({ fromStage: from, toStage: to, changedByUserId: '42' });
      expect(events.publishInTransaction).toHaveBeenCalledWith(
        expect.anything(), 'OpportunityStageChanged', '99',
        expect.objectContaining({ fromStage: from, toStage: to }),
      );
    });
  });

  it('accepts the stage index or slug as stageId', async () => {
    setup('Needs Analysis');
    await expect(service.proceed('99', '1')).resolves.toMatchObject({ stage: 'Impact Analysis' });
    setup('Needs Analysis');
    await expect(service.proceed('99', 'needs-analysis')).resolves.toMatchObject({ stage: 'Impact Analysis' });
  });

  it('proceed is blocked by missing fields, and nothing is saved', async () => {
    setup('Proposal', { proposalDate: null });
    await expect(service.proceed('99', 'Proposal')).rejects.toBeInstanceOf(BadRequestException);
    expect(saved).toBeUndefined();
    expect(historyRows).toHaveLength(0);
  });

  it('checks rules on the locked row, not the earlier read', async () => {
    setup('Negotiation');
    lockedRow = makeOpp('Closed Won'); // another request closed it in between
    await expect(
      service.closeWon('99', { poDate: '2026-12-15', poValue: 5_000_000 }),
    ).rejects.toThrow('This stage cannot be closed');
    expect(saved).toBeUndefined();
  });

  it('close-won stores PO and billing details on the opportunity and in history', async () => {
    setup('Negotiation');
    const res = await service.closeWon('99', {
      poDate: '2026-12-15',
      poValue: 5_000_000,
      projectStartActual: '2027-01-05',
      firstBillingDate: null,
      firstBillingValue: 250_000,
    });
    expect(res).toMatchObject({ stage: 'Closed Won', _prob: 100, _forecast: 'Closed', poReceived: 'Yes' });
    expect(saved).toMatchObject({ poValue: '5000000.00', closedValue: '5000000.00', closeDate: '2026-12-15' });
    expect(historyRows[0]).toMatchObject({
      poDate: '2026-12-15',
      poValue: '5000000.00',
      projectStartActual: '2027-01-05',
      firstBillingDate: null,
      firstBillingValue: '250000.00',
    });
    expect(historyRows[0].narrative).toBe('Stage: Negotiation → Closed Won · PO ₹5000000 dated 2026-12-15');
  });

  it('early close requires an override and stores the justification in history', async () => {
    const openTask = { id: 't', t: 'Demo', due: 'x', o: 'y', done: false, stage: 'Proposal' };
    setup('Proposal', { stageTasks: [openTask] });
    await expect(service.closeLost('99', { lostReason: 'Price' })).rejects.toBeInstanceOf(BadRequestException);

    setup('Proposal', { stageTasks: [openTask] });
    await service.closeLost('99', {
      lostReason: 'Price',
      lostReasonRemark: 'Too high',
      overrideReason: 'Strategic deal',
      overrideJustification: '  CEO call  ',
    });
    expect(saved).toMatchObject({ stage: 'Closed Lost', earlyClose: true, overrideJustification: 'CEO call' });
    expect(historyRows[0]).toMatchObject({
      lostReason: 'Price',
      earlyClose: true,
      overrideReason: 'Strategic deal',
      overrideJustification: 'CEO call',
    });
    expect(historyRows[0].narrative).toBe(
      'Stage: Proposal → Closed Lost (Price — Too high) · override: Strategic deal',
    );
  });

  it('close-no-bid moves to No Bid', async () => {
    setup('Proposal');
    const res = await service.closeNoBid('99', {});
    expect(res.stage).toBe('No Bid');
    expect(res._forecast).toBe('Omitted');
  });

  it('hold stores reason, review date and the stage it was held from', async () => {
    setup('Proposal');
    const res = await service.hold('99', {
      holdReason: 'External',
      holdDetails: ' Budget freeze ',
      holdUntil: '2027-01-10',
    });
    expect(res).toMatchObject({ stage: 'On Hold', holdFrom: 'Proposal', holdUntil: '2027-01-10' });
    expect(historyRows[0]).toMatchObject({
      holdReason: 'External',
      holdDetails: 'Budget freeze',
      holdUntil: '2027-01-10',
      holdFromStage: 'Proposal',
    });
  });

  it('cannot hold an opportunity that is already closed', async () => {
    setup('Closed Won');
    await expect(
      service.hold('99', { holdReason: 'Internal', holdDetails: 'x' }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('reopen moves On Hold back to an open stage and records the fallback', async () => {
    setup('On Hold', { holdFromStage: 'Proposal', holdUntil: '2027-01-10' });
    const res = await service.reopen('99', {
      stage: 'Qualification',
      plan: 'Phased rollout',
      comment: 'Bank approved capex',
      changedByUserId: 3,
    });
    expect(res).toMatchObject({ stage: 'Qualification', _prob: 10, holdUntil: null });
    expect(res.holdFallbacks?.[0]).toMatchObject({ kind: 'Reopened', by: '3', plan: 'Phased rollout' });
  });
});
