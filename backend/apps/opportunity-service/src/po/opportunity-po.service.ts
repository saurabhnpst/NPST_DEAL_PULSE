import { BadRequestException, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { ExternalReferencesService } from '../integrations/external-references.service';
import { OpportunityEventPublisher } from '../events/opportunity-event.publisher';
import { OPPORTUNITY_EVENT_TYPES } from '../events/domain-event';
import { commercialVersionTotal } from '../common/opportunity-calculations';
import { PoReceiptDto } from './dto/po-receipt.dto';

@Injectable()
export class OpportunityPoService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly opportunities: OpportunitiesService,
    private readonly externalRefs: ExternalReferencesService,
    private readonly events: OpportunityEventPublisher,
  ) {}

  /**
   * Records the PO (number, date, value, optional document id) and sets poReceived = Yes.
   * When poValue is omitted it defaults to the latest commercial version total.
   * Returns the full opportunity, plus `warnings` when the document id could not be verified.
   */
  async saveReceipt(id: string, dto: PoReceiptDto, actorId?: number) {
    const warnings: string[] = [];
    if (dto.poFileDocumentId != null) {
      const check = await this.externalRefs.validateDocumentId(dto.poFileDocumentId);
      if (!check.ok) throw new BadRequestException(check.message);
      if (check.message) warnings.push(check.message);
    }

    const opp = await this.opportunities.findEntity(id);

    await this.dataSource.transaction(async (manager) => {
      const repo = manager.getRepository(Opportunity);
      const o = await repo.findOneByOrFail({ id: opp.id });
      const lines = o.currentCommercialLines ?? [];
      const lastVersion = Math.max(0, (lines[0]?.p?.length ?? 1) - 1);
      const poValue = dto.poValue ?? commercialVersionTotal(lines, lastVersion);

      o.poNumber = dto.poNumber.trim();
      o.poDate = dto.poDate.slice(0, 10);
      o.poValue = poValue.toFixed(2);
      o.poReceived = 'Yes';
      if (dto.poFileDocumentId != null) o.poFileDocumentId = String(dto.poFileDocumentId);
      if (actorId != null) o.lastModifiedByUserId = String(actorId);
      await repo.save(o);

      await this.events.publishInTransaction(
        manager,
        OPPORTUNITY_EVENT_TYPES.PO_RECEIVED,
        o.id,
        { publicId: o.publicId, poNumber: o.poNumber, poDate: o.poDate, poValue },
      );
    });

    const data = await this.opportunities.findOne(opp.id);
    return warnings.length ? { ...data, warnings } : data;
  }
}
