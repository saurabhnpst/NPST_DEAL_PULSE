import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { DataSource } from 'typeorm';
import { configureApp } from '../src/app.setup';
import { HealthController } from '../src/health.controller';
import { IntegrationsModule } from '../src/integrations/integrations.module';

/** HTTP check of /health with the real IntegrationsModule (mock vs real chosen from env). */
describe('GET /api/v1/health', () => {
  const start = async (dbOk: boolean) => {
    const module = await Test.createTestingModule({
      imports: [IntegrationsModule],
      controllers: [HealthController],
      providers: [
        {
          provide: DataSource,
          useValue: { query: dbOk ? jest.fn() : jest.fn().mockRejectedValue(new Error('down')) },
        },
      ],
    }).compile();
    const app: INestApplication = module.createNestApplication();
    configureApp(app);
    await app.init();
    return app;
  };

  afterEach(() => {
    delete process.env.OPPORTUNITY_SERVICE_URL;
  });

  it('reports database + every dependency as mock when no URLs are set', async () => {
    const app = await start(true);
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({
      status: 'ok',
      database: 'connected',
      integrations: { auth: 'mock', notification: 'mock', rfp: 'mock', opportunity: 'mock' },
    });
    await app.close();
  });

  it('switches a dependency to real just by setting its URL', async () => {
    process.env.OPPORTUNITY_SERVICE_URL = 'http://localhost:3005';
    const app = await start(false);
    const res = await request(app.getHttpServer()).get('/api/v1/health').expect(200);
    expect(res.body).toMatchObject({
      status: 'degraded',
      database: 'disconnected',
      integrations: { opportunity: 'real', auth: 'mock' },
    });
    await app.close();
  });
});
