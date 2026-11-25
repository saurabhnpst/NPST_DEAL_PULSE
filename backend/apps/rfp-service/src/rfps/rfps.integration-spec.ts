import dataSource from '../database/data-source';
import { Rfp } from '../entities/rfp.entity';

describe('RFP persistence (database integration)', () => {
  const createdIds: string[] = [];

  beforeAll(async () => {
    await dataSource.initialize();
    const db = await dataSource.query('SELECT DATABASE() AS db_name');
    if (db[0]?.db_name !== 'rfp_db') {
      throw new Error(
        `Integration tests require DB_NAME=rfp_db (got ${db[0]?.db_name})`,
      );
    }
  });

  afterAll(async () => {
    if (createdIds.length > 0) {
      await dataSource
        .getRepository(Rfp)
        .createQueryBuilder()
        .delete()
        .whereInIds(createdIds)
        .execute();
    }
    await dataSource.destroy();
  });

  it('confirms database readiness on rfp_db', async () => {
    await dataSource.query('SELECT 1');
    const rows = await dataSource.query('SELECT DATABASE() AS db_name');
    expect(rows[0].db_name).toBe('rfp_db');
    const tables = await dataSource.query(
      "SHOW TABLES LIKE 'rfps'",
    );
    expect(tables.length).toBe(1);
  });

  it('persists, queries, updates, and soft-deletes an RFP row', async () => {
    const repo = dataSource.getRepository(Rfp);
    const leadId = '33333333-3333-4333-8333-333333333333';

    const saved = await repo.save(
      repo.create({
        title: 'Persistence integration RFP',
        referenceNumber: 'INT/DB/003',
        leadId,
        status: 'Registered',
      }),
    );
    createdIds.push(saved.id);

    const byLead = await repo.find({
      where: { leadId },
      order: { createdAt: 'DESC' },
    });
    expect(byLead.some((r) => r.id === saved.id)).toBe(true);

    saved.status = 'In Review';
    await repo.save(saved);
    const reloaded = await repo.findOneOrFail({ where: { id: saved.id } });
    expect(reloaded.status).toBe('In Review');

    await repo.softRemove(reloaded);
    const gone = await repo.findOne({ where: { id: saved.id } });
    expect(gone).toBeNull();
  });
});