import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpportunityActivity } from '../entities/opportunity-activity.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { OpportunityEventPublisher } from '../events/opportunity-event.publisher';
import { OPPORTUNITY_EVENT_TYPES } from '../events/domain-event';
import { CreateActivityDto } from './dto/create-activity.dto';

@Injectable()
export class OpportunityActivitiesService {
  constructor(
    @InjectRepository(OpportunityActivity)
    private readonly activityRepo: Repository<OpportunityActivity>,
    private readonly opportunities: OpportunitiesService,
    private readonly events: OpportunityEventPublisher,
  ) {}

  async list(id: string) {
    const opp = await this.opportunities.findEntity(id);
    const rows = await this.activityRepo.find({
      where: { opportunityId: opp.id },
      order: { occurredAt: 'DESC', id: 'DESC' },
    });
    return rows.map((a) => ({
      id: a.id,
      activityKind: a.activityKind,
      withParty: a.withParty,
      summary: a.summary,
      actorUserId: a.actorUserId,
      actorLabel: a.actorLabel,
      occurredAt: a.occurredAt.toISOString(),
      createdAt: a.createdAt.toISOString(),
    }));
  }

  async create(id: string, dto: CreateActivityDto) {
    const opp = await this.opportunities.findEntity(id);
    const occurredAt = dto.occurredAt ? new Date(dto.occurredAt) : new Date();
    const row = this.activityRepo.create({
      opportunityId: opp.id,
      activityKind: dto.activityKind,
      summary: dto.summary.trim(),
      withParty: dto.withParty?.trim() ?? null,
      occurredAt,
      actorUserId: dto.actorUserId != null ? String(dto.actorUserId) : null,
      actorLabel: dto.actorLabel ?? null,
    });
    const saved = await this.activityRepo.save(row);
    await this.events.publish(opp.id, OPPORTUNITY_EVENT_TYPES.ACTIVITY_LOGGED, {
      publicId: opp.publicId,
      activityId: saved.id,
      activityKind: saved.activityKind,
    });
    return {
      id: saved.id,
      activityKind: saved.activityKind,
      summary: saved.summary,
      occurredAt: saved.occurredAt.toISOString(),
    };
  }
}