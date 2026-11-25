import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { OpportunityPublicIdSequence } from '../entities/opportunity-public-id-sequence.entity';

@Injectable()
export class OpportunityPublicIdService {
  /**
   * Allocates OPP-YYYY-NNNNN using a per-year counter (MySQL upsert) so concurrent creates stay unique.
   */
  async allocate(manager: EntityManager): Promise<string> {
    const year = new Date().getFullYear();

    await manager.query(
      `INSERT INTO opportunity_public_id_sequences (year, last_number)
       VALUES (?, 1)
       ON DUPLICATE KEY UPDATE last_number = last_number + 1`,
      [year],
    );

    const row = await manager.findOneByOrFail(OpportunityPublicIdSequence, { year });
    const seq = String(row.lastNumber).padStart(5, '0');
    return `OPP-${year}-${seq}`;
  }
}