import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { OpportunityCommercialsService } from './opportunity-commercials.service';
import { SaveCommercialVersionDto, UpdateCommercialsDto } from './dto/update-commercials.dto';

@Controller('opportunities/:id/commercials')
export class OpportunityCommercialsController {
  constructor(private readonly commercials: OpportunityCommercialsService) {}

  @Get()
  async get(@Param('id') id: string) {
    return ok(await this.commercials.get(id));
  }

  @Patch()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCommercialsDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.commercials.update(id, dto, pickActor(actor, dto.changedByUserId)));
  }

  @Post('versions')
  async saveVersion(
    @Param('id') id: string,
    @Body() dto: SaveCommercialVersionDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.commercials.saveVersion(id, dto, pickActor(actor, dto.changedByUserId)));
  }
}
