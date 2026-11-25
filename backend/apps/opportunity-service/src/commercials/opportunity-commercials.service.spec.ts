import { BadRequestException } from '@nestjs/common';
import { CommercialLineJson, Opportunity } from '../entities/opportunity.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { OpportunityCommercialsService } from './opportunity-commercials.service';

describe('OpportunityCommercialsService', () => {
  const line = (p: number[]): CommercialLineJson => ({ id: 'l1', t: 'Licence', q: 2, p });

  let row: Opportunity;
  let revisions: { versionLabel: string }[];
  let service: OpportunityCommercialsService;

  beforeEach(() => {
    revisions = [];
    row = { id: '9', publicId: 'OPP-2026-00009', currentCommercialLines: [] } as unknown as Opportunity;
    const manager = {
      getRepository: () => ({
        findOne: async () => row,
        findOneByOrFail: async () => row,
        save: async (o: Opportunity) => o,
      }),
      count: async () => revisions.length,
      create: (_e: unknown, data: { versionLabel: string }) => data,
      save: async (data: { versionLabel?: string }) => {
        if (data.versionLabel) revisions.push({ versionLabel: data.versionLabel });
        return data;
      },
    };
    service = new OpportunityCommercialsService(
      { find: async () => revisions } as never,
      { transaction: async (fn: (m: unknown) => unknown) => fn(manager) } as never,
      { findEntity: async () => row } as unknown as OpportunitiesService,
      { publishInTransaction: jest.fn() } as never,
    );
  });

  it('labels columns "Initial" + saved versions', () => {
    expect(service.versionLabels([line([100])], [])).toEqual(['Initial']);
    expect(service.versionLabels([line([100, 90])], [{ versionLabel: 'v2' }] as never)).toEqual(['Initial', 'v2']);
    expect(service.versionLabels([], [])).toEqual(['Initial']);
  });

  it('saving a version adds exactly one price column', async () => {
    row.currentCommercialLines = [line([100])];
    const res = await service.saveVersion('9', { versionLabel: 'Revised' });
    expect(res.lines[0].p).toEqual([100, 100]);
    expect(res.versions).toEqual(['Initial', 'Revised']);
    expect(res.totalByVersion).toEqual([200, 200]);
  });

  it('does not add a second column when the frontend already added it', async () => {
    // Current frontend: PATCH lines with the new column, then POST /versions.
    row.currentCommercialLines = [line([100, 80])];
    const res = await service.saveVersion('9', { versionLabel: 'Revised' });
    expect(res.lines[0].p).toEqual([100, 80]);
    expect(res.versions).toEqual(['Initial', 'Revised']);
  });

  it('rejects lines with different numbers of price columns', async () => {
    await expect(
      service.update('9', { lines: [line([1]), { ...line([1, 2]), id: 'l2' }] }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('cannot save a version without lines', async () => {
    await expect(service.saveVersion('9', {})).rejects.toBeInstanceOf(BadRequestException);
  });
});
