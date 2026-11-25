import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OpportunityEvaluation } from '../entities/opportunity-evaluation.entity';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityActivity } from '../entities/opportunity-activity.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';

type EvalBody = Record<string, unknown>;
const CORE = ['id', 'oppId', 'name', 'type', 'approval', 'status'];
const publicEvalId = (e: OpportunityEvaluation) => `EVAL-${e.createdAt.getFullYear()}-${String(e.id).padStart(3, '0')}`;
const toId = (id: string) => id.replace(/^EVAL-\d{4}-0*/, '');

/** Pre-PO evaluations. The UI shape is `{ id, oppId, name, type, approval, status, ...details }`. */
@Injectable()
export class OpportunityEvaluationsService {
  constructor(
    @InjectRepository(OpportunityEvaluation) private readonly repo: Repository<OpportunityEvaluation>,
    @InjectRepository(Opportunity) private readonly opps: Repository<Opportunity>,
    @InjectRepository(OpportunityActivity) private readonly activities: Repository<OpportunityActivity>,
    private readonly opportunities: OpportunitiesService,
  ) {}

  async list(oppId?: string) {
    const where = oppId ? { opportunityId: (await this.opportunities.findEntity(oppId)).id } : {};
    const rows = await this.repo.find({ where, order: { createdAt: 'DESC' } });
    const ids = [...new Set(rows.map((r) => r.opportunityId))];
    const opps = ids.length ? await this.opps.findByIds(ids) : [];
    const publicId = new Map(opps.map((o) => [String(o.id), o.publicId]));
    return rows.map((r) => this.toView(r, publicId.get(String(r.opportunityId)) ?? String(r.opportunityId)));
  }

  async create(body: EvalBody, actorId?: number) {
    const opp = await this.opportunities.findEntity(String(body.oppId ?? ''));
    const saved = await this.repo.save(this.repo.create({
      opportunityId: opp.id,
      name: String(body.name || 'Evaluation').slice(0, 255),
      evalType: String(body.type || 'PoC').slice(0, 32),
      approval: String(body.approval || 'Pending').slice(0, 32),
      status: String(body.status || 'Not Started').slice(0, 64),
      details: this.details(body),
    }));
    await this.activities.save(this.activities.create({
      opportunityId: opp.id, activityKind: 'System', summary: `Pre-PO ${saved.evalType} created: ${saved.name}`,
      actorUserId: actorId != null ? String(actorId) : null, occurredAt: new Date(),
    }));
    return this.toView(saved, opp.publicId);
  }

  async update(id: string, body: EvalBody) {
    const row = await this.repo.findOne({ where: { id: toId(id) } });
    if (!row) throw new NotFoundException('Evaluation not found');
    if (body.name !== undefined) row.name = String(body.name).slice(0, 255);
    if (body.type !== undefined) row.evalType = String(body.type).slice(0, 32);
    if (body.approval !== undefined) row.approval = String(body.approval).slice(0, 32);
    if (body.status !== undefined) row.status = String(body.status).slice(0, 64);
    row.details = { ...(row.details ?? {}), ...this.details(body) };
    const saved = await this.repo.save(row);
    const opp = await this.opps.findOne({ where: { id: row.opportunityId } });
    return this.toView(saved, opp?.publicId ?? String(row.opportunityId));
  }

  private details(body: EvalBody): Record<string, unknown> {
    return Object.fromEntries(Object.entries(body).filter(([k]) => !CORE.includes(k)));
  }

  private toView(r: OpportunityEvaluation, oppPublicId: string) {
    return { ...(r.details ?? {}), id: publicEvalId(r), oppId: oppPublicId, name: r.name, type: r.evalType, approval: r.approval, status: r.status };
  }
}
