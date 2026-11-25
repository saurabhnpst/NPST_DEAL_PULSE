import { BadRequestException, NotFoundException } from '@nestjs/common';
import { DataSource, Repository, SelectQueryBuilder } from 'typeorm';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityProduct } from '../entities/opportunity-product.entity';
import { OpportunitiesService } from './opportunities.service';
import { OpportunityPublicIdService } from './opportunity-public-id.service';

describe('OpportunitiesService', () => {
  let service: OpportunitiesService;
  let opportunityRepo: jest.Mocked<Repository<Opportunity>>;
  let dataSource: { transaction: jest.Mock };
  let publicIdService: { allocate: jest.Mock };

  const mockEntity = (): Opportunity =>
    ({
      id: '1',
      publicId: 'OPP-2026-00001',
      name: 'Test',
      accountName: 'Bank',
      accountId: null,
      stage: 'Qualification',
      closeDate: '2027-01-01',
      currency: 'INR',
      arr: '100.00',
      oneTime: '0.00',
      ownerUserId: '99',
      leadId: null,
      leadSource: null,
      oppType: null,
      compellingEvent: null,
      products: [
        {
          id: '10',
          productSlot: 1,
          productTsp: 'UPI Switch',
          modules: ['TPAP'],
        } as OpportunityProduct,
      ],
      createdAt: new Date('2026-01-01T00:00:00.000Z'),
      updatedAt: new Date('2026-01-02T00:00:00.000Z'),
      deletedAt: null,
    }) as Opportunity;

  beforeEach(() => {
    const qb = {
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      addOrderBy: jest.fn().mockReturnThis(),
      skip: jest.fn().mockReturnThis(),
      take: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      getManyAndCount: jest.fn().mockResolvedValue([[mockEntity()], 1]),
    } as unknown as SelectQueryBuilder<Opportunity>;

    opportunityRepo = {
      createQueryBuilder: jest.fn().mockReturnValue(qb),
      findOne: jest.fn(),
      softRemove: jest.fn(),
    } as unknown as jest.Mocked<Repository<Opportunity>>;

    dataSource = {
      transaction: jest.fn(async (fn) => {
        const manager = {
          create: jest.fn((_, data) => ({ ...data, id: '1' })),
          save: jest.fn(async (entity) => entity),
          findOneByOrFail: jest.fn(),
          find: jest.fn(),
          delete: jest.fn(),
          getRepository: jest.fn().mockReturnValue(opportunityRepo),
          query: jest.fn(),
        };
        return fn(manager);
      }),
    };

    publicIdService = {
      allocate: jest.fn().mockResolvedValue('OPP-2026-00099'),
    };

    const events = { publishInTransaction: jest.fn(), publish: jest.fn() };
    service = new OpportunitiesService(
      opportunityRepo,
      dataSource as unknown as DataSource,
      publicIdService as unknown as OpportunityPublicIdService,
      events as never,
    );
  });

  describe('parseIdentifier', () => {
    it('accepts public id', () => {
      expect(service.parseIdentifier('OPP-2026-00131')).toEqual({
        publicId: 'OPP-2026-00131',
      });
    });

    it('accepts numeric id', () => {
      expect(service.parseIdentifier('42')).toEqual({ pk: '42' });
    });

    it('rejects invalid id', () => {
      expect(() => service.parseIdentifier('bad-id')).toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('returns paginated items', async () => {
      const result = await service.findAll({ page: 1, limit: 10 });
      expect(result.total).toBe(1);
      expect(result.items[0].publicId).toBe('OPP-2026-00001');
    });
  });

  describe('findOne', () => {
    it('throws when not found', async () => {
      opportunityRepo.findOne = jest.fn().mockResolvedValue(null);
      await expect(service.findOne('42')).rejects.toThrow(NotFoundException);
    });

    it('returns mapped opportunity', async () => {
      opportunityRepo.findOne = jest.fn().mockResolvedValue(mockEntity());
      const row = await service.findOne('1');
      expect(row.name).toBe('Test');
    });
  });

  describe('softDelete', () => {
    it('returns deleted metadata', async () => {
      const entity = mockEntity();
      const deleted = { ...entity, deletedAt: new Date('2026-03-01T00:00:00.000Z') };
      opportunityRepo.findOne = jest.fn().mockResolvedValue(entity);
      opportunityRepo.softRemove = jest.fn().mockResolvedValue(deleted);

      const result = await service.softDelete('1');
      expect(result.publicId).toBe('OPP-2026-00001');
      expect(result.deletedAt).toBe('2026-03-01T00:00:00.000Z');
      expect(opportunityRepo.softRemove).toHaveBeenCalledWith(entity);
    });
  });

  describe('create', () => {
    it('rejects duplicate product slots', async () => {
      await expect(
        service.create({
          name: 'A',
          accountName: 'B',
          stage: 'Qualification',
          closeDate: '2027-01-01',
          currency: 'INR',
          arr: 1,
          products: [
            { productSlot: 1, productTsp: 'UPI', modules: [] },
            { productSlot: 1, productTsp: 'BBPS', modules: [] },
          ],
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });
});