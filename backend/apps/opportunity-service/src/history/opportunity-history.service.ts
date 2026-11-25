import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpportunityActivity } from '../entities/opportunity-activity.entity';
import { OpportunityStageHistory } from '../entities/opportunity-stage-history.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';

export type TimelineItem = { t: string; m: string; at: string; kind: string };

@Injectable()
export class OpportunityHistoryService {
  constructor(
    @InjectRepository(OpportunityStageHistory)
    private readonly stageHistRepo: Repository<OpportunityStageHistory>,
    @InjectRepository(OpportunityActivity)
    private readonly activityRepo: Repository<OpportunityActivity>,
    private readonly opportunities: OpportunitiesService,
  ) {}

  async timeline(id: string): Promise<TimelineItem[]> {
    const opp = await this.opportunities.findEntity(id);
    const [stages, activities] = await Promise.all([
      this.stageHistRepo.find({
        where: { opportunityId: opp.id },
        order: { changedAt: 'DESC' },
      }),
      this.activityRepo.find({
        where: { opportunityId: opp.id },
        order: { occurredAt: 'DESC' },
      }),
    ]);

    const items: TimelineItem[] = [];

    for (const s of stages) {
      items.push({
        kind: 'Stage',
        t: s.narrative ?? `Stage: ${s.fromStage ?? '—'} → ${s.toStage}`,
        m: s.changedByUserId ? `User ${s.changedByUserId}` : 'System',
        at: s.changedAt.toISOString(),
      });
    }

    for (const a of activities) {
      const prefix = a.withParty
        ? `${a.activityKind} with ${a.withParty}`
        : a.activityKind;
      items.push({
        kind: a.activityKind,
        t: `${prefix}: ${a.summary}`,
        m: a.actorLabel ?? (a.actorUserId ? `User ${a.actorUserId}` : 'System'),
        at: a.occurredAt.toISOString(),
      });
    }

    items.sort((a, b) => (a.at < b.at ? 1 : -1));
    return items;
  }
}