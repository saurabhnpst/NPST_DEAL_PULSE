import { BadRequestException } from '@nestjs/common';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityProduct } from '../entities/opportunity-product.entity';
import { OPEN_STAGES } from './stage-definitions';
import { StageValidationService } from './stage-validation.service';

describe('StageValidationService', () => {
  const svc = new StageValidationService();

  const product = (tsp: string): OpportunityProduct =>
    ({ productSlot: 1, productTsp: tsp, modules: ['TPAP'] }) as OpportunityProduct;

  const oppAt = (stage: string, extra: Partial<Opportunity> = {}): Opportunity =>
    ({
      id: '1',
      stage,
      name: 'Deal',
      ownerUserId: '10',
      accountName: 'Bank',
      closeDate: '2027-06-01',
      currency: 'INR',
      arr: '100000',
      oneTime: '10000',
      compellingEvent: 'Renewal',
      reqReceived: 'Yes',
      presalesInvolved: 'No',
      demoDone: true,
      sow: 'Yes',
      proposalDate: '2026-11-01',
      contractSigned: 'No',
      stageTasks: [],
      ...extra,
    }) as Opportunity;

  describe.each([
    ['Qualification', 'Needs Analysis'],
    ['Needs Analysis', 'Impact Analysis'],
    ['Impact Analysis', 'Proposal'],
    ['Proposal', 'Negotiation'],
  ])('proceed %s → %s', (from) => {
    it('allows when required fields and tasks are satisfied', () => {
      expect(() =>
        svc.assertCanProceed(oppAt(from), [product('UPI')]),
      ).not.toThrow();
    });
  });

  it('blocks proceed from Negotiation', () => {
    expect(() =>
      svc.assertCanProceed(oppAt('Negotiation'), [product('UPI')]),
    ).toThrow(BadRequestException);
  });

  it('blocks proceed with open stage tasks', () => {
    const opp = oppAt('Qualification', {
      stageTasks: [{ id: '1', t: 'Call CIO', due: '1 Nov', o: 'Owner', done: false, stage: 'Qualification' }],
    });
    expect(() => svc.assertCanProceed(opp, [product('UPI')])).toThrow(BadRequestException);
  });

  OPEN_STAGES.forEach((stage) => {
    it(`hold allowed from ${stage}`, () => {
      expect(() => svc.assertCanHold(oppAt(stage))).not.toThrow();
    });
  });

  it('rejects hold when already on hold', () => {
    expect(() => svc.assertCanHold(oppAt('On Hold'))).toThrow(BadRequestException);
  });

  it('close-won validates poDate and poValue', () => {
    expect(() =>
      svc.validateCloseWon(oppAt('Negotiation'), { poDate: '', poValue: 0 }),
    ).toThrow(BadRequestException);
  });

  it('close-lost validates lostReason picklist', () => {
    expect(() =>
      svc.validateCloseLost(oppAt('Negotiation'), { lostReason: 'Invalid' }),
    ).toThrow(BadRequestException);
  });

  it('close-no-bid passes without extra fields', () => {
    expect(() => svc.validateCloseNoBid(oppAt('Negotiation'), {})).not.toThrow();
  });

  it('reopen requires On Hold and open target stage', () => {
    expect(() => svc.assertCanReopen(oppAt('On Hold'), 'Proposal')).not.toThrow();
    expect(() => svc.assertCanReopen(oppAt('Proposal'), 'Qualification')).toThrow(BadRequestException);
  });

  it('early close override enforced on close-won', () => {
    const opp = oppAt('Proposal', {
      stageTasks: [{ id: 'x', t: 'Early task', due: '1 Nov', o: 'A', done: false, stage: 'Qualification' }],
    });
    expect(() =>
      svc.validateCloseWon(opp, { poDate: '2026-12-01', poValue: 1_000_000 }),
    ).toThrow(BadRequestException);
    expect(() =>
      svc.validateCloseWon(opp, {
        poDate: '2026-12-01',
        poValue: 1_000_000,
        overrideReason: 'Strategic deal',
        overrideJustification: 'Board mandate',
      }),
    ).not.toThrow();
  });
});