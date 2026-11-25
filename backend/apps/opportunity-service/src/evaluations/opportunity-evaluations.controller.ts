import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId } from '../common/actor';
import { OpportunityEvaluationsService } from './opportunity-evaluations.service';

/** Pre-PO evaluations: GET ?opportunityId= · POST · PATCH :id (id = EVAL-YYYY-NNN). */
@Controller('opportunity-evaluations')
export class OpportunityEvaluationsController {
  constructor(private readonly evaluations: OpportunityEvaluationsService) {}

  @Get()
  async list(@Query('opportunityId') opportunityId?: string) {
    return ok(await this.evaluations.list(opportunityId));
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() body: Record<string, unknown>, @ActorId() actor?: number) {
    return ok(await this.evaluations.create(body ?? {}, actor));
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() body: Record<string, unknown>) {
    return ok(await this.evaluations.update(id, body ?? {}));
  }
}
