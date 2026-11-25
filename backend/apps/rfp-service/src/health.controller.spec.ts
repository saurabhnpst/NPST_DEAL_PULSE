import { ServiceUnavailableException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';

describe('HealthController', () => {
  let controller: HealthController;
  const dataSource = {
    query: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: 'DataSource', useValue: dataSource }],
    }).compile();

    controller = module.get(HealthController);
    jest.clearAllMocks();
  });

  it('returns live status', () => {
    const result = controller.live();
    expect(result.status).toBe('ok');
    expect(result.service).toBe('rfp-service');
  });

  it('returns ready when database responds', async () => {
    dataSource.query
      .mockResolvedValueOnce(undefined)
      .mockResolvedValueOnce([{ db_name: 'rfp_db' }]);

    const result = await controller.ready();
    expect(result.status).toBe('ready');
    expect(result.dbName).toBe('rfp_db');
  });

  it('throws when database is unavailable', async () => {
    dataSource.query.mockRejectedValue(new Error('connection refused'));
    await expect(controller.ready()).rejects.toBeInstanceOf(
      ServiceUnavailableException,
    );
  });
});