import { STAGES, nextOpenStage, stageMeta } from './stage-definitions';

describe('stage-definitions', () => {
  it('exposes all frontend stages with probability and forecast', () => {
    expect(STAGES.map((s) => s.name)).toEqual([
      'Qualification',
      'Needs Analysis',
      'Impact Analysis',
      'Proposal',
      'Negotiation',
      'Closed Won',
      'Closed Lost',
      'No Bid',
      'On Hold',
    ]);
    expect(stageMeta('Proposal')).toEqual({
      name: 'Proposal',
      prob: 60,
      forecast: 'Best Case',
      open: true,
    });
  });

  it('maps open stage progression', () => {
    expect(nextOpenStage('Qualification')).toBe('Needs Analysis');
    expect(nextOpenStage('Negotiation')).toBeNull();
    expect(stageMeta('Closed Lost').forecast).toBe('Omitted');
  });
});