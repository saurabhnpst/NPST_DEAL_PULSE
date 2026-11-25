import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityPipelineService } from './opportunity-pipeline.service';

describe('OpportunityPipelineService', () => {
  it('summarizes open opportunities by stage', async () => {
    const repo = {
      find: jest.fn().mockResolvedValue([
        { id: '1', publicId: 'OPP-2026-00001', name: 'A', accountName: 'Bank', stage: 'Qualification', closeDate: '2027-01-01', arr: '10000000', oneTime: '0', ownerUserId: '1' },
        { id: '2', publicId: 'OPP-2026-00002', name: 'B', accountName: 'Bank', stage: 'Closed Won', closeDate: '2027-01-01', arr: '100', oneTime: '0', ownerUserId: '1' },
      ] as Opportunity[]),
    };
    const svc = new OpportunityPipelineService(repo as never);
    const summary = await svc.summary();
    expect(summary.openCount).toBe(1);
    expect(summary.pipelineValue).toBe(10_000_000);
    expect(summary.byStage[0].stage).toBe('Qualification');
    expect(summary.byStage[0].count).toBe(1);
  });
});