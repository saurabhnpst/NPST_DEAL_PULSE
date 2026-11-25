import { Body, Controller, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { SUBJECT } from '../common/statuses';
import { ActorDto } from '../common/validation';
import { HistoryService } from '../history/history.service';
import { AssignmentsService } from './assignments.service';
import {
  AddRequirementsDto,
  ApproveDto,
  ChangeTechLeadDto,
  ListAssignmentsQueryDto,
  ManualProposalDto,
  ReturnDto,
} from './assignments.dto';

/** Technical (Tech Lead) assignments. `:opportunityId` = OPP-YYYY-NNNNN. */
@ApiTags('Technical assignments')
@ApiSecurity('x-user-id')
@Controller('assignments')
export class AssignmentsController {
  constructor(
    private readonly service: AssignmentsService,
    private readonly history: HistoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List assignments (e.g. status=PENDING_APPROVAL for the Solution Manager queue)' })
  async list(@Query() query: ListAssignmentsQueryDto) {
    const { items, total, page, limit } = await this.service.list(query);
    return ok(items, { page, limit, total, totalPages: Math.ceil(total / limit) });
  }

  @Get('opportunity/:opportunityId')
  @ApiOperation({ summary: "An opportunity's assignments (with their requirements) and its review queue" })
  async forOpportunity(@Param('opportunityId') opportunityId: string) {
    return ok(await this.service.forOpportunity(opportunityId));
  }

  @Post('opportunity/:opportunityId/requirements')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Receive RFP requirements and create proposals (used by the RFP Service)' })
  async addRequirements(
    @Param('opportunityId') opportunityId: string,
    @Body() dto: AddRequirementsDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.service.addRequirements(opportunityId, dto.requirements, pickActor(actor, dto.changedByUserId)));
  }

  @Post('opportunity/:opportunityId/auto-assign')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Fetch RFP requirements if none yet, re-check the review queue, propose default Tech Leads' })
  async autoAssign(
    @Param('opportunityId') opportunityId: string,
    @Body() dto: ActorDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.service.autoAssign(opportunityId, pickActor(actor, dto.changedByUserId)));
  }

  @Post('opportunity/:opportunityId')
  @ApiOperation({ summary: 'Propose a Tech Lead by hand for a product' })
  async proposeManually(
    @Param('opportunityId') opportunityId: string,
    @Body() dto: ManualProposalDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.service.proposeManually(opportunityId, dto, pickActor(actor, dto.changedByUserId)));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return ok(await this.service.get(id));
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    await this.service.get(id);
    return ok(await this.history.list(SUBJECT.TECHNICAL_ASSIGNMENT, id));
  }

  @Post(':id/approve')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solution Manager approves: Tech Lead notified and added to the opportunity People' })
  async approve(@Param('id') id: string, @Body() dto: ApproveDto, @ActorId() actor?: number) {
    return ok(await this.service.approve(id, dto.comment, pickActor(actor, dto.changedByUserId)));
  }

  @Post(':id/change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solution Manager proposes a different Tech Lead (needs approval again)' })
  async change(@Param('id') id: string, @Body() dto: ChangeTechLeadDto, @ActorId() actor?: number) {
    return ok(await this.service.change(id, dto.techLeadUserId, dto.comment, pickActor(actor, dto.changedByUserId)));
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solution Manager returns / rejects the proposal (reason required)' })
  async returnAssignment(@Param('id') id: string, @Body() dto: ReturnDto, @ActorId() actor?: number) {
    return ok(await this.service.returnAssignment(id, dto.comment, pickActor(actor, dto.changedByUserId)));
  }
}
