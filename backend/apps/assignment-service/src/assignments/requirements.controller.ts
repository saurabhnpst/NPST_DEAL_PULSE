import { Body, Controller, Get, Param, Patch, Query } from '@nestjs/common';
import { ApiOperation, ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { SUBJECT } from '../common/statuses';
import { HistoryService } from '../history/history.service';
import { AssignmentsService } from './assignments.service';
import { MapRequirementDto } from './assignments.dto';

/** RFP requirements and the review queue (unmapped / unclear requirements). */
@ApiTags('Requirements review queue')
@ApiSecurity('x-user-id')
@Controller('requirements')
export class RequirementsController {
  constructor(
    private readonly service: AssignmentsService,
    private readonly history: HistoryService,
  ) {}

  @Get('review-queue')
  @ApiOperation({ summary: 'Requirements waiting for a person (UNMAPPED or NEEDS_REVIEW)' })
  @ApiQuery({ name: 'opportunityId', required: false })
  async reviewQueue(@Query('opportunityId') opportunityId?: string) {
    return ok(await this.service.reviewQueue(opportunityId || undefined));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Set or clear the product of a requirement; mapped ones join a proposal' })
  async map(@Param('id') id: string, @Body() dto: MapRequirementDto, @ActorId() actor?: number) {
    return ok(await this.service.mapRequirement(id, dto.productTsp, pickActor(actor, dto.changedByUserId)));
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    return ok(await this.history.list(SUBJECT.REQUIREMENT, id));
  }
}
