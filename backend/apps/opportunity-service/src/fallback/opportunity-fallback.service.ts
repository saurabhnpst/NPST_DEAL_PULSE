import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HoldFallbackJson, Opportunity } from '../entities/opportunity.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { OpportunityResponse } from '../opportunities/opportunity.mapper';
import { SaveFallbackDto } from './dto/save-fallback.dto';

@Injectable()
export class OpportunityFallbackService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly opportunities: OpportunitiesService,
  ) {}

  /** Adds a fallback plan to `holdFallbacks` (newest first) without moving the stage. */
  async saveFallback(id: string, dto: SaveFallbackDto, actorId?: number): Promise<OpportunityResponse> {
    if (!dto.plan.trim() || !dto.comment.trim()) {
      throw new BadRequestException('plan and comment are required');
    }
    const opp = await this.opportunities.findEntity(id);
    const entry: HoldFallbackJson = {
      kind: 'Fallback',
      by: actorId != null ? String(actorId) : 'system',
      at: new Date().toISOString(),
      plan: dto.plan.trim(),
      suggestion: dto.suggestion?.trim() ?? '',
      comment: dto.comment.trim(),
    };

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Opportunity);
      const o = await repo.findOne({ where: { id: opp.id }, lock: { mode: 'pessimistic_write' } });
      if (!o) return;
      o.holdFallbacks = [entry, ...(o.holdFallbacks ?? [])];
      if (actorId != null) o.lastModifiedByUserId = String(actorId);
      await repo.save(o);
    });
    return this.opportunities.findOne(opp.id);
  }
}
