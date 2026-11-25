import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId } from '../common/actor';
import { OpportunityDecisionsService } from './opportunity-decisions.service';
import { DecideDto, RecommendDto } from './opportunity-decisions.dto';

/** P&L decisions: GET list · POST recommendation (Sales) · POST :id/decide (P&L Head). */
@Controller('opportunity-decisions')
export class OpportunityDecisionsController {
  constructor(private readonly decisions: OpportunityDecisionsService) {}

  @Get()
  async list() {
    return ok(await this.decisions.list());
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async recommend(@Body() dto: RecommendDto, @ActorId() actor?: number) {
    return ok(await this.decisions.recommend(dto, actor));
  }

  @Post(':id/decide')
  @HttpCode(HttpStatus.OK)
  async decide(@Param('id') id: string, @Body() dto: DecideDto, @ActorId() actor?: number) {
    return ok(await this.decisions.decide(id, dto, actor));
  }
}
