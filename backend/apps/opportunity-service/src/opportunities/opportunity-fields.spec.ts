import { Opportunity } from '../entities/opportunity.entity';
import { applyFields } from './opportunity-fields';
import { toOpportunityResponse } from './opportunity.mapper';

describe('applyFields', () => {
  it('converts values to column format and skips missing fields', () => {
    const o = { name: 'Old', region: 'Domestic' } as Opportunity;
    applyFields(o, {
      arr: 1500000,
      ownerUserId: 7,
      closeDate: '2027-03-31T00:00:00.000Z',
      champion: true,
      competitors: ['FSS'],
    });
    expect(o).toMatchObject({
      name: 'Old',
      region: 'Domestic',
      arr: '1500000',
      ownerUserId: '7',
      closeDate: '2027-03-31',
      champion: true,
      competitors: ['FSS'],
    });
  });

  it('clears a field with null', () => {
    const o = { region: 'Domestic', ownerUserId: '7' } as Opportunity;
    applyFields(o, { region: null, ownerUserId: null });
    expect(o.region).toBeNull();
    expect(o.ownerUserId).toBeNull();
  });

  it('ignores fields that are not editable', () => {
    const o = { stage: 'Qualification' } as Opportunity;
    applyFields(o, { stage: 'Closed Won' } as never);
    expect(o.stage).toBe('Qualification');
  });
});

describe('toOpportunityResponse', () => {
  const entity = {
    id: '1',
    publicId: 'OPP-2026-00001',
    name: 'Deal',
    accountName: 'Bank',
    stage: 'Proposal',
    recordType: 'TSP',
    arr: '1000000.00',
    oneTime: '500000.00',
    updatedArr: null,
    year2: '1000000.00',
    fy27Q1: '100.00',
    fy27Jul: '10.00',
    fy27Aug: '20.00',
    fy27Mar: '5.00',
    region: 'Domestic',
    holdFromStage: 'Negotiation',
    products: [
      { id: '2', productSlot: 2, productTsp: 'BBPS', modules: [] },
      { id: '1', productSlot: 1, productTsp: 'UPI', modules: ['TPAP'] },
    ],
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-02T00:00:00.000Z'),
    deletedAt: null,
  } as unknown as Opportunity;

  it('returns every field, nulls for unset ones, and derived values', () => {
    const r = toOpportunityResponse(entity);
    expect(r.region).toBe('Domestic');
    expect(r.economicBuyer).toBeNull();
    expect(r.holdFrom).toBe('Negotiation');
    expect(r.products.map((p) => p.productSlot)).toEqual([1, 2]);
    expect(r).toMatchObject({
      _prob: 60,
      _forecast: 'Best Case',
      _vertical: 'TSP',
      _amount: 1500000,
      _tcv: 2500000,
      _totalArr: 1000000,
      _category: 'CAT 1',
      _fy27Q1: 100,
      _fy27Q2: 30,
      _fy27Q3: 0,
      _fy27Q4: 5,
      _fy27: 135,
    });
  });
});
