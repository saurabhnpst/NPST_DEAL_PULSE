import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { CommercialLineJson, Opportunity } from '../entities/opportunity.entity';
import { OpportunityCommercialHistory } from '../entities/opportunity-commercial-history.entity';
import { commercialVersionTotal } from '../common/opportunity-calculations';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { OpportunityEventPublisher } from '../events/opportunity-event.publisher';
import { OPPORTUNITY_EVENT_TYPES } from '../events/domain-event';
import { SaveCommercialVersionDto, UpdateCommercialsDto } from './dto/update-commercials.dto';

/**
 * Commercials tab.
 * Each line has one unit price per version: `p[0]` = Initial, `p[1]` = first saved version, …
 * Version labels = "Initial" + the labels of saved versions (opportunity_commercial_history).
 */
@Injectable()
export class OpportunityCommercialsService {
  constructor(
    @InjectRepository(OpportunityCommercialHistory)
    private readonly historyRepo: Repository<OpportunityCommercialHistory>,
    private readonly dataSource: DataSource,
    private readonly opportunities: OpportunitiesService,
    private readonly events: OpportunityEventPublisher,
  ) {}

  async get(id: string) {
    const opp = await this.opportunities.findEntity(id);
    const revisions = await this.historyRepo.find({
      where: { opportunityId: opp.id },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
    const lines = opp.currentCommercialLines ?? [];
    const versions = this.versionLabels(lines, revisions);
    return {
      lines,
      versions,
      licence: opp.licence,
      milestones: opp.milestones,
      amcTerm: opp.amcTerm,
      totalByVersion: versions.map((_, vi) => commercialVersionTotal(lines, vi)),
      currentVersionIndex: Math.max(0, versions.length - 1),
    };
  }

  async update(id: string, dto: UpdateCommercialsDto, actorId?: number) {
    if (dto.lines) this.assertLines(dto.lines);
    const opp = await this.opportunities.findEntity(id);

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Opportunity);
      const o = await repo.findOneByOrFail({ id: opp.id });
      if (dto.lines !== undefined) o.currentCommercialLines = dto.lines ?? [];
      if (dto.licence !== undefined) o.licence = dto.licence;
      if (dto.milestones !== undefined) o.milestones = dto.milestones;
      if (dto.amcTerm !== undefined) o.amcTerm = dto.amcTerm;
      if (actorId != null) o.lastModifiedByUserId = String(actorId);
      await repo.save(o);
    });
    return this.get(opp.id);
  }

  /**
   * Saves a version snapshot and opens a new price column (a copy of the last one).
   * The current frontend adds that column itself before calling this; then no extra column is added.
   */
  async saveVersion(id: string, dto: SaveCommercialVersionDto, actorId?: number) {
    const opp = await this.opportunities.findEntity(id);
    const label = dto.versionLabel?.trim() || `Revised (${new Date().toISOString().slice(0, 10)})`;

    await this.dataSource.transaction(async (manager) => {
      const o = await manager.getRepository(Opportunity).findOne({
        where: { id: opp.id },
        lock: { mode: 'pessimistic_write' },
      });
      const lines = o?.currentCommercialLines ?? [];
      if (!o || !lines.length) {
        throw new BadRequestException('Add commercial lines before saving a version');
      }

      const savedVersions = await manager.count(OpportunityCommercialHistory, {
        where: { opportunityId: o.id },
      });
      const columns = lines[0].p.length;
      const alreadyAdded = columns > savedVersions + 1;
      const nextLines: CommercialLineJson[] = alreadyAdded
        ? lines
        : lines.map((l) => ({ ...l, p: [...l.p, l.p[l.p.length - 1] ?? 0] }));

      o.currentCommercialLines = nextLines;
      if (actorId != null) o.lastModifiedByUserId = String(actorId);
      await manager.save(o);

      await manager.save(
        manager.create(OpportunityCommercialHistory, {
          opportunityId: o.id,
          versionLabel: label,
          licence: o.licence,
          milestones: o.milestones,
          amcTerm: o.amcTerm,
          lineItems: nextLines.map((l) => ({
            id: l.id,
            t: l.t,
            q: l.q,
            unit_price: l.p[l.p.length - 1] ?? 0,
          })),
          createdByUserId: actorId != null ? String(actorId) : null,
        }),
      );
      await this.events.publishInTransaction(
        manager,
        OPPORTUNITY_EVENT_TYPES.COMMERCIAL_REVISED,
        o.id,
        { publicId: o.publicId, versionLabel: label },
      );
    });
    return this.get(opp.id);
  }

  /** One label per price column: "Initial", then saved version labels. */
  versionLabels(
    lines: CommercialLineJson[],
    revisions: Pick<OpportunityCommercialHistory, 'versionLabel'>[],
  ): string[] {
    const labels = ['Initial', ...revisions.map((r) => r.versionLabel)];
    if (!lines.length) return labels;
    const columns = lines[0].p?.length ?? 1;
    while (labels.length < columns) labels.push(`Version ${labels.length + 1}`);
    return labels.slice(0, columns);
  }

  private assertLines(lines: CommercialLineJson[]): void {
    const columns = lines[0]?.p.length;
    for (const l of lines) {
      if (!l.t?.trim()) throw new BadRequestException('Commercial line title required');
      if (l.p.length !== columns) {
        throw new BadRequestException('Every commercial line needs the same number of price columns');
      }
    }
  }
}
