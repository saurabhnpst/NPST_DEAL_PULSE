import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { OpportunityActivitiesService } from './opportunity-activities.service';
import { CreateActivityDto } from './dto/create-activity.dto';

@Controller('opportunities/:id/activities')
export class OpportunityActivitiesController {
  constructor(private readonly activities: OpportunityActivitiesService) {}

  @Get()
  async list(@Param('id') id: string) {
    return ok(await this.activities.list(id));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(
    @Param('id') id: string,
    @Body() dto: CreateActivityDto,
    @ActorId() actor?: number,
  ) {
    const actorUserId = pickActor(actor, dto.actorUserId);
    return ok(await this.activities.create(id, { ...dto, actorUserId }));
  }
}
