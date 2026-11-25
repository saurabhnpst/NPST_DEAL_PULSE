import { readFileSync } from 'fs';
import { join } from 'path';
import { OPPORTUNITY_SCHEMA_STATEMENTS } from '../migrations/1732200000000-OpportunitySchema';

/** Fails when database/schema.sql and the migration drift apart. */
describe('database schema', () => {
  const normalize = (s: string) => s.replace(/\s+/g, ' ').trim();

  it('schema.sql matches the migration SQL', () => {
    const sql = readFileSync(join(__dirname, '../../database/schema.sql'), 'utf8')
      .split(/\r?\n/)
      .filter((line) => !line.trim().startsWith('--'))
      .join('\n');
    const fromFile = sql.split(';').map(normalize).filter(Boolean);

    expect(fromFile).toEqual(OPPORTUNITY_SCHEMA_STATEMENTS.map(normalize));
  });
});
