import { Test, TestingModule } from '@nestjs/testing';
import { EntityManager } from 'typeorm';
import { OpportunityPublicIdService } from './opportunity-public-id.service';
import { OpportunityPublicIdSequence } from '../entities/opportunity-public-id-sequence.entity';

describe('OpportunityPublicIdService', () => {
  let service: OpportunityPublicIdService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [OpportunityPublicIdService],
    }).compile();
    service = module.get(OpportunityPublicIdService);
  });

  it('formats id from sequence row', async () => {
    const year = new Date().getFullYear();
    const manager = {
      query: jest.fn().mockResolvedValue(undefined),
      findOneByOrFail: jest.fn().mockResolvedValue({ year, lastNumber: 42 }),
    } as unknown as EntityManager;

    const publicId = await service.allocate(manager);
    expect(publicId).toBe(`OPP-${year}-00042`);
    expect(manager.query).toHaveBeenCalledWith(
      expect.stringContaining('opportunity_public_id_sequences'),
      [year],
    );
    expect(manager.findOneByOrFail).toHaveBeenCalledWith(
      OpportunityPublicIdSequence,
      { year },
    );
  });
});