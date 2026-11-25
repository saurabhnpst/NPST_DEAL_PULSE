import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as request from 'supertest';
import { configureApp } from '../src/app.setup';
import { AssignmentsController } from '../src/assignments/assignments.controller';
import { RequirementsController } from '../src/assignments/requirements.controller';
import { AssignmentsService } from '../src/assignments/assignments.service';
import { HandoffsController } from '../src/handoffs/handoffs.controller';
import { HandoffsService } from '../src/handoffs/handoffs.service';
import { ProductVerticalsController } from '../src/product-verticals/product-verticals.controller';
import { ProductVerticalsService } from '../src/product-verticals/product-verticals.service';
import { HistoryService } from '../src/history/history.service';

/** Routes + validation (same setup as main.ts); services are mocked. */
describe('Assignment Service routes', () => {
  let app: INestApplication;
  const assignments = {
    list: jest.fn().mockResolvedValue({ items: [], total: 0, page: 1, limit: 50 }),
    addRequirements: jest.fn().mockResolvedValue({}),
    approve: jest.fn().mockResolvedValue({}),
    returnAssignment: jest.fn().mockResolvedValue({}),
    mapRequirement: jest.fn().mockResolvedValue({}),
  };
  const handoffs = { create: jest.fn().mockResolvedValue({}), accept: jest.fn().mockResolvedValue({}) };
  const productVerticals = { create: jest.fn().mockResolvedValue({}) };

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [AssignmentsController, RequirementsController, HandoffsController, ProductVerticalsController],
      providers: [
        { provide: AssignmentsService, useValue: assignments },
        { provide: HandoffsService, useValue: handoffs },
        { provide: ProductVerticalsService, useValue: productVerticals },
        { provide: HistoryService, useValue: { list: jest.fn() } },
      ],
    }).compile();
    app = module.createNestApplication();
    configureApp(app);
    await app.init();
  });
  afterAll(() => app.close());
  beforeEach(() => jest.clearAllMocks());

  const http = () => request(app.getHttpServer());

  it('list returns pagination meta', async () => {
    const res = await http().get('/api/v1/assignments?status=PENDING_APPROVAL').expect(200);
    expect(res.body.meta).toMatchObject({ page: 1, total: 0 });
  });

  it('rejects an unknown status filter', async () => {
    const res = await http().get('/api/v1/assignments?status=DONE').expect(400);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
  });

  it('requirements: title is required, products is a list', async () => {
    await http().post('/api/v1/assignments/opportunity/OPP-2026-00001/requirements')
      .send({ requirements: [{ productTsp: 'UPI' }] }).expect(400);
    await http().post('/api/v1/assignments/opportunity/OPP-2026-00001/requirements')
      .send({ requirements: [{ title: 'x', products: 'UPI' }] }).expect(400);
    await http().post('/api/v1/assignments/opportunity/OPP-2026-00001/requirements')
      .set('x-user-id', '2')
      .send({ requirements: [{ title: 'UPI switch', productTsp: 'UPI' }] }).expect(200);
    expect(assignments.addRequirements).toHaveBeenCalledWith('OPP-2026-00001', [expect.objectContaining({ title: 'UPI switch' })], 2);
  });

  it('approve passes the x-user-id header as the actor (header wins over body)', async () => {
    await http().post('/api/v1/assignments/7/approve').set('x-user-id', '5').send({ changedByUserId: 9 }).expect(200);
    expect(assignments.approve).toHaveBeenCalledWith('7', undefined, 5);
  });

  it('return needs a reason', async () => {
    await http().post('/api/v1/assignments/7/return').set('x-user-id', '5').send({}).expect(400);
    await http().post('/api/v1/assignments/7/return').set('x-user-id', '5').send({ comment: 'Wrong lead' }).expect(200);
  });

  it("requirement mapping: '' means not mapped (null)", async () => {
    await http().patch('/api/v1/requirements/3').send({ productTsp: '' }).expect(200);
    expect(assignments.mapRequirement).toHaveBeenCalledWith('3', null, undefined);
  });

  it('handoff: title required, due date must be a date', async () => {
    await http().post('/api/v1/handoffs').send({}).expect(400);
    await http().post('/api/v1/handoffs').send({ title: 'AePS RFP', dueDate: 'soon' }).expect(400);
    await http().post('/api/v1/handoffs').send({ title: 'AePS RFP', dueDate: '2026-12-01', pendingInputs: ['NDA'] }).expect(201);
  });

  it('product master: vertical must be TSP or EVOK', async () => {
    await http().post('/api/v1/product-verticals').send({ productTsp: 'UPI', vertical: 'XYZ' }).expect(400);
    await http().post('/api/v1/product-verticals').send({ productTsp: 'UPI', vertical: 'TSP', techLeadUserId: 7 }).expect(201);
  });
});
