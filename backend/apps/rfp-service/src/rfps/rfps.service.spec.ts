import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Rfp } from '../entities/rfp.entity';
import { RfpDocumentService } from '../documents/rfp-document.service';
import { RfpsService } from './rfps.service';

describe('RfpsService', () => {
  let service: RfpsService;
  const repo = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
    find: jest.fn(),
    softRemove: jest.fn(),
    createQueryBuilder: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        RfpsService,
        { provide: getRepositoryToken(Rfp), useValue: repo },
        {
          provide: RfpDocumentService,
          useValue: { upsertAssociationFromRfp: jest.fn().mockResolvedValue(undefined) },
        },
      ],
    }).compile();

    service = module.get(RfpsService);
    jest.clearAllMocks();
  });

  it('creates an RFP with default status', async () => {
    repo.create.mockReturnValue({ title: 'Test RFP' });
    repo.save.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      title: 'Test RFP',
      status: 'Draft',
    });

    const result = await service.create({ title: 'Test RFP' });
    expect(repo.create).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Test RFP', status: 'Draft' }),
    );
    expect(result.status).toBe('Draft');
  });

  it('throws when RFP is not found', async () => {
    repo.findOne.mockResolvedValue(null);
    await expect(
      service.findOne('00000000-0000-4000-8000-000000000099'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('soft-deletes an existing RFP', async () => {
    const rfp = {
      id: '00000000-0000-4000-8000-000000000001',
      title: 'To delete',
    };
    repo.findOne.mockResolvedValue(rfp);
    repo.softRemove.mockResolvedValue(rfp);

    await service.remove(rfp.id);
    expect(repo.softRemove).toHaveBeenCalledWith(rfp);
  });

  it('paginates list queries', async () => {
    const qb = {
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[{ id: '1' }], 1]),
    };
    repo.createQueryBuilder.mockReturnValue(qb);

    const result = await service.findAll({ page: 1, limit: 10 });
    expect(result.meta.total).toBe(1);
    expect(result.data).toHaveLength(1);
  });
});