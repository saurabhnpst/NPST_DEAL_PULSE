jest.mock('./opportunities.service', () => ({
  OpportunitiesService: class OpportunitiesService {},
}));

import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';

describe('OpportunitiesController', () => {
  const sample = {
    id: '1',
    publicId: 'OPP-2026-00001',
    name: 'Test',
  };

  const service: jest.Mocked<Pick<OpportunitiesService, 'create' | 'findAll' | 'findOne' | 'update' | 'softDelete'>> = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    update: jest.fn(),
    softDelete: jest.fn(),
  };

  const pipeline = { summary: jest.fn() };
  const controller = new OpportunitiesController(
    service as unknown as OpportunitiesService,
    pipeline as never,
  );

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('create wraps success response', async () => {
    service.create.mockResolvedValue(sample as never);
    const res = await controller.create({} as never);
    expect(res).toEqual({ success: true, data: sample });
  });

  it('list includes pagination meta', async () => {
    service.findAll.mockResolvedValue({
      items: [sample as never],
      total: 25,
      page: 2,
      limit: 10,
    });
    const res = await controller.list({ page: 2, limit: 10 } as never);
    expect(res).toEqual({
      success: true,
      data: [sample],
      meta: { page: 2, limit: 10, total: 25, totalPages: 3 },
    });
  });

  it('getOne wraps success response', async () => {
    service.findOne.mockResolvedValue(sample as never);
    const res = await controller.getOne('1');
    expect(res).toEqual({ success: true, data: sample });
  });

  it('update wraps success response', async () => {
    service.update.mockResolvedValue(sample as never);
    const res = await controller.update('1', {} as never);
    expect(res).toEqual({ success: true, data: sample });
  });

  it('remove wraps soft-delete payload', async () => {
    const deleted = {
      id: '1',
      publicId: 'OPP-2026-00001',
      deletedAt: '2026-03-01T00:00:00.000Z',
    };
    service.softDelete.mockResolvedValue(deleted);
    const res = await controller.remove('1', 7);
    expect(res).toEqual({ success: true, data: deleted });
    expect(service.softDelete).toHaveBeenCalledWith('1', 7);
  });
});