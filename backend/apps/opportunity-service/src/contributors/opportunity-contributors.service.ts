import { BadRequestException, Injectable } from '@nestjs/common';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { ExternalReferencesService } from '../integrations/external-references.service';
import { UpdateContributorsDto } from './dto/update-contributors.dto';

/** Owner, pre-sales and deal team. Writes go through OpportunitiesService.update. */
@Injectable()
export class OpportunityContributorsService {
  constructor(
    private readonly opportunities: OpportunitiesService,
    private readonly externalRefs: ExternalReferencesService,
  ) {}

  async get(id: string) {
    const opp = await this.opportunities.findEntity(id);
    return {
      ownerUserId: opp.ownerUserId,
      presalesUserId: opp.presalesUserId,
      presalesName: opp.presalesName,
      dealTeam: opp.dealTeam ?? [],
    };
  }

  /** Returns the full opportunity, plus `warnings` when a user id could not be verified. */
  async update(id: string, dto: UpdateContributorsDto, actorId?: number) {
    const warnings: string[] = [];
    for (const userId of [dto.ownerUserId, dto.presalesUserId]) {
      if (userId == null) continue;
      const check = await this.externalRefs.validateUserId(userId);
      if (!check.ok) throw new BadRequestException(check.message);
      if (check.message) warnings.push(check.message);
    }

    const data = await this.opportunities.update(id, dto, actorId);
    return warnings.length ? { ...data, warnings } : data;
  }
}
