import { ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { RfpsController } from './rfps.controller';
import { RfpsService } from './rfps.service';

describe('RfpsController (validation)', () => {
  let app: Awaited<ReturnType<typeof createApp>>;
  const rfpsService = {
    create: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    findByLeadId: jest.fn(),
    findByOpportunityId: jest.fn(),
    update: jest.fn(),
    remove: jest.fn(),
  };

  async function createApp() {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RfpsController],
      providers: [{ provide: RfpsService, useValue: rfpsService }],
    }).compile();
    const nestApp = module.createNestApplication();
    nestApp.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
        transformOptions: { enableImplicitConversion: true },
      }),
    );
    nestApp.setGlobalPrefix('api/v1');
    await nestApp.init();
    return nestApp;
  }

  beforeAll(async () => {
    app = await createApp();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects create without title', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/rfps')
      .send({ issuerName: 'Bank' })
      .expect(400);
  });

  it('rejects invalid uuid path params', async () => {
    await request(app.getHttpServer())
      .get('/api/v1/rfps/not-a-uuid')
      .expect(400);
  });

  it('rejects unknown dto properties', async () => {
    await request(app.getHttpServer())
      .post('/api/v1/rfps')
      .send({ title: 'RFP', unknownField: true })
      .expect(400);
  });

  it('accepts valid create payload', async () => {
    rfpsService.create.mockResolvedValue({
      id: '00000000-0000-4000-8000-000000000001',
      title: 'BBPS RFP',
    });
    await request(app.getHttpServer())
      .post('/api/v1/rfps')
      .send({ title: 'BBPS RFP', leadId: '00000000-0000-4000-8000-000000000002' })
      .expect(201);
  });
});