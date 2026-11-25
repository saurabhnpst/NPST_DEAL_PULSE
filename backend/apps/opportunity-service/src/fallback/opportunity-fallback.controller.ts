import { Body, Controller, Param, Patch } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { OpportunityFallbackService } from './opportunity-fallback.service';
import { SaveFallbackDto } from './dto/save-fallback.dto';

@Controller('opportunities/:id/fallback')
export class OpportunityFallbackController {
  constructor(private readonly fallback: OpportunityFallbackService) {}

  @Patch()
  async save(
    @Param('id') id: string,
    @Body() dto: SaveFallbackDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.fallback.saveFallback(id, dto, pickActor(actor, dto.changedByUserId)));
  }
}
