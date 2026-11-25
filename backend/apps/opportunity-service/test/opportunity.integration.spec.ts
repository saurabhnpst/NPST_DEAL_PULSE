import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { configureApp } from '../src/app.setup';
import { OpportunitiesController } from '../src/opportunities/opportunities.controller';
import { OpportunitiesService } from '../src/opportunities/opportunities.service';
import { OpportunityPipelineService } from '../src/pipeline/opportunity-pipeline.service';
import { OpportunityRevenueController } from '../src/revenue/opportunity-revenue.controller';
import { OpportunityRevenueService } from '../src/revenue/opportunity-revenue.service';
import { OpportunityStagesController } from '../src/stages/opportunity-stages.controller';
import { StageTransitionService } from '../src/stages/stage-transition.service';

/** HTTP layer with real validation (same setup as main.ts) and mocked services. */
describe('Opportunity HTTP integration (mocked services)', () => {
  let app: INestApplication;

  const opportunities = {
    findOne: jest.fn(),
    findAll: jest.fn(),
    create: jest.fn().mockResolvedValue({ publicId: 'OPP-2026-00001' }),
    update: jest.fn().mockResolvedValue({ publicId: 'OPP-2026-00001' }),
  };
  const pipeline = {
    summary: jest.fn().mockResolvedValue({
      openCount: 2,
      pipelineValue: 20_000_000,
      weightedPipeline: 5_000_000,
      byStage: [],
    }),
  };
  const revenue = {
    get: jest.fn().mockResolvedValue({
      arr: '100',
      oneTime: '0',
      _amount: 100,
      dealValue: 100,
    }),
  };
  const stages = {
    closeWon: jest.fn().mockResolvedValue({ stage: 'Closed Won' }),
  };

  const validCreate = {
    name: 'UPI switch',
    accountName: 'Axis Bank',
    closeDate: '2027-03-31',
    arr: 1000000,
    products: [{ productSlot: 1, productTsp: 'UPI', modules: ['TPAP'] }],
  };

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [
        OpportunitiesController,
        OpportunityRevenueController,
        OpportunityStagesController,
      ],
      providers: [
        { provide: OpportunitiesService, useValue: opportunities },
        { provide: OpportunityPipelineService, useValue: pipeline },
        { provide: OpportunityRevenueService, useValue: revenue },
        { provide: StageTransitionService, useValue: stages },
      ],
    }).compile();

    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => jest.clearAllMocks());

  it('GET /opportunities/pipeline returns summary', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/opportunities/pipeline')
      .expect(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.openCount).toBe(2);
  });

  it('GET /opportunities/:id/revenue returns calculated fields', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/opportunities/1/revenue')
      .expect(200);
    expect(res.body.data.dealValue).toBe(100);
  });

  describe('POST /opportunities', () => {
    it('accepts the minimal payload and any Details-tab field', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/opportunities')
        .send({ ...validCreate, region: 'Domestic', champion: true, fy27Jul: 5000 })
        .expect(201);
      const dto = opportunities.create.mock.calls[0][0];
      expect(dto).toMatchObject({ region: 'Domestic', champion: true, fy27Jul: 5000 });
    });

    it('rejects a closed stage on create', async () => {
      const res = await request(app.getHttpServer())
        .post('/api/v1/opportunities')
        .send({ ...validCreate, stage: 'Closed Won' })
        .expect(400);
      expect(res.body.error.code).toBe('VALIDATION_ERROR');
      expect(opportunities.create).not.toHaveBeenCalled();
    });

    it('rejects a missing name', async () => {
      await request(app.getHttpServer())
        .post('/api/v1/opportunities')
        .send({ ...validCreate, name: '' })
        .expect(400);
    });
  });

  describe('PATCH /opportunities/:id', () => {
    it('accepts side-panel tasks with teamsAt', async () => {
      const task = { id: 't1', t: 'Send deck', due: '25 Nov', o: 'Priya S.', done: false, teamsAt: '10:30' };
      await request(app.getHttpServer())
        .patch('/api/v1/opportunities/OPP-2026-00001')
        .send({ stageTasks: [task] })
        .expect(200);
      expect(opportunities.update.mock.calls[0][1].stageTasks[0]).toMatchObject(task);
    });

    it("turns '' into null so an empty date clears the field", async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/opportunities/1')
        .send({ updatedCloseDate: '', region: '' })
        .expect(200);
      expect(opportunities.update.mock.calls[0][1]).toMatchObject({
        updatedCloseDate: null,
        region: null,
      });
    });

    it('does not allow clearing required fields', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/opportunities/1')
        .send({ name: '' })
        .expect(400);
      expect(opportunities.update).not.toHaveBeenCalled();
    });

    it('drops unknown fields and stage instead of failing', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/opportunities/1')
        .send({ notes: 'ok', stage: 'Closed Won', somethingElse: 1 })
        .expect(200);
      const dto = opportunities.update.mock.calls[0][1];
      expect(dto.notes).toBe('ok');
      expect(dto).not.toHaveProperty('stage');
      expect(dto).not.toHaveProperty('somethingElse');
    });

    it('validates picklist values', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/opportunities/1')
        .send({ sow: 'Maybe' })
        .expect(400);
    });
  });

  describe('x-user-id header (set by the API gateway)', () => {
    it('is passed to the service as the acting user', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/opportunities/1')
        .set('x-user-id', '7')
        .send({ notes: 'x' })
        .expect(200);
      expect(opportunities.update).toHaveBeenCalledWith('1', expect.anything(), 7);
    });

    it('wins over changedByUserId in the body; body is the fallback', async () => {
      const body = { poDate: '2026-12-01', poValue: 1, changedByUserId: 2 };
      await request(app.getHttpServer())
        .post('/api/v1/opportunities/1/close-won').set('x-user-id', '7').send(body).expect(200);
      expect(stages.closeWon.mock.calls[0][1].changedByUserId).toBe(7);

      await request(app.getHttpServer())
        .post('/api/v1/opportunities/1/close-won').send(body).expect(200);
      expect(stages.closeWon.mock.calls[1][1].changedByUserId).toBe(2);
    });

    it('ignores a header that is not a positive integer', async () => {
      await request(app.getHttpServer())
        .patch('/api/v1/opportunities/1')
        .set('x-user-id', 'abc')
        .send({ notes: 'x' })
        .expect(200);
      expect(opportunities.update).toHaveBeenCalledWith('1', expect.anything(), undefined);
    });
  });

  it("POST /close-won accepts '' for the optional dates", async () => {
    await request(app.getHttpServer())
      .post('/api/v1/opportunities/1/close-won')
      .send({ poDate: '2026-12-01', poValue: 500000, projectStartActual: '', firstBillingDate: '' })
      .expect(200);
    expect(stages.closeWon.mock.calls[0][1]).toMatchObject({
      poDate: '2026-12-01',
      poValue: 500000,
      projectStartActual: null,
      firstBillingDate: null,
    });
  });
});
