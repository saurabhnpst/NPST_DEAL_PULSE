import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { OpportunityDecision } from '../entities/opportunity-decision.entity';
import { OpportunityActivity } from '../entities/opportunity-activity.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { DecideDto, RecommendDto } from './opportunity-decisions.dto';

/** Sales recommendation → P&L Head Proceed / Reject. One open (undecided) recommendation per opportunity. */
@Injectable()
export class OpportunityDecisionsService {
  constructor(
    @InjectRepository(OpportunityDecision) private readonly repo: Repository<OpportunityDecision>,
    @InjectRepository(Opportunity) private readonly opps: Repository<Opportunity>,
    @InjectRepository(OpportunityActivity) private readonly activities: Repository<OpportunityActivity>,
    private readonly opportunities: OpportunitiesService,
  ) {}

  async list() {
    const rows = await this.repo.find({ order: { recommendedAt: 'DESC' } });
    const ids = [...new Set(rows.map((r) => r.opportunityId))];
    const opps = ids.length ? await this.opps.findByIds(ids) : [];
    const publicId = new Map(opps.map((o) => [String(o.id), o.publicId]));
    return rows.map((r) => this.toView(r, publicId.get(String(r.opportunityId)) ?? String(r.opportunityId)));
  }

  /** Repeated submit updates the open recommendation instead of creating a duplicate. */
  async recommend(dto: RecommendDto, actorId?: number) {
    const opp = await this.opportunities.findEntity(dto.oppId);
    const value = (Number(opp.arr) || 0) + (Number(opp.oneTime) || 0);
    const first = await this.repo.findOne({ where: { opportunityId: opp.id }, order: { recommendedAt: 'ASC' } });
    const open = await this.repo.findOne({ where: { opportunityId: opp.id, decision: IsNull() } });
    const row = Object.assign(open ?? this.repo.create({ opportunityId: opp.id }), {
      recommendation: dto.rec,
      synopsis: dto.syn,
      concern: dto.concern ?? null,
      proposalRef: dto.prop ?? null,
      dealValue: String(value),
      initialValue: first ? first.initialValue : String(value),
      recommendedByUserId: actorId != null ? String(actorId) : null,
      recommendedAt: new Date(),
    });
    const saved = await this.repo.save(row);
    await this.log(opp.id, `Sent to P&L Head with a ${dto.rec} recommendation`, actorId);
    return this.toView(saved, opp.publicId);
  }

  /** First valid decision wins; a decided recommendation cannot be decided again. */
  async decide(id: string, dto: DecideDto, actorId?: number) {
    if (dto.v === 'Reject' && !dto.note?.trim()) throw new BadRequestException('A note is required to reject');
    const row = await this.repo.findOne({ where: { id } });
    if (!row) throw new NotFoundException('Decision not found');
    if (row.decision) throw new ConflictException(`Already decided: ${row.decision}`);
    Object.assign(row, { decision: dto.v, decisionNote: dto.note?.trim() || null, decidedByUserId: actorId != null ? String(actorId) : null, decidedAt: new Date() });
    const saved = await this.repo.save(row);
    await this.log(row.opportunityId, `P&L Head: ${dto.v}${dto.note?.trim() ? ' — ' + dto.note.trim() : ''}`, actorId);
    const opp = await this.opps.findOne({ where: { id: row.opportunityId } });
    return this.toView(saved, opp?.publicId ?? String(row.opportunityId));
  }

  private async log(opportunityId: string, summary: string, actorId?: number) {
    await this.activities.save(this.activities.create({
      opportunityId, activityKind: 'System', summary, actorUserId: actorId != null ? String(actorId) : null, occurredAt: new Date(),
    }));
  }

  private toView(r: OpportunityDecision, oppPublicId: string) {
    return {
      id: r.id,
      oppId: oppPublicId,
      rec: r.recommendation,
      syn: r.synopsis,
      concern: r.concern,
      prop: r.proposalRef,
      dealValue: Number(r.dealValue),
      initialValue: Number(r.initialValue),
      recByUserId: r.recommendedByUserId,
      recAt: r.recommendedAt.toISOString(),
      done: r.decision
        ? { v: r.decision, note: r.decisionNote, byUserId: r.decidedByUserId, at: r.decidedAt?.toISOString() ?? null }
        : null,
    };
  }
}
