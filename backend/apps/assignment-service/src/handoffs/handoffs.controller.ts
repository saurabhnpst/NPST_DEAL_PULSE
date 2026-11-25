import { Body, Controller, Get, HttpCode, HttpStatus, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { SUBJECT } from '../common/statuses';
import { HistoryService } from '../history/history.service';
import { HandoffsService } from './handoffs.service';
import {
  AcceptHandoffDto,
  CreateHandoffDto,
  HandoffNoteDto,
  ListHandoffsQueryDto,
  ReturnHandoffDto,
  UpdateHandoffDto,
} from './handoffs.dto';

/** Sales → Pre-Sales/Solution handoffs. */
@ApiTags('Pre-Sales handoffs')
@ApiSecurity('x-user-id')
@Controller('handoffs')
export class HandoffsController {
  constructor(
    private readonly service: HandoffsService,
    private readonly history: HistoryService,
  ) {}

  @Get()
  @ApiOperation({ summary: 'List handoffs (e.g. assigneeUserId=5 for "my Pre-Sales work")' })
  async list(@Query() query: ListHandoffsQueryDto) {
    const { items, total, page, limit } = await this.service.list(query);
    return ok(items, { page, limit, total, totalPages: Math.ceil(total / limit) });
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return ok(await this.service.get(id));
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    await this.service.get(id);
    return ok(await this.history.list(SUBJECT.HANDOFF, id));
  }

  @Post()
  @ApiOperation({ summary: 'Sales requests Pre-Sales support' })
  async create(@Body() dto: CreateHandoffDto, @ActorId() actor?: number) {
    return ok(await this.service.create(dto, pickActor(actor, dto.changedByUserId)));
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update details / link the opportunity' })
  async update(@Param('id') id: string, @Body() dto: UpdateHandoffDto, @ActorId() actor?: number) {
    return ok(await this.service.update(id, dto, pickActor(actor, dto.changedByUserId)));
  }

  @Post(':id/accept')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pre-Sales Manager accepts and names the Solutions owner (synced to the opportunity)' })
  async accept(@Param('id') id: string, @Body() dto: AcceptHandoffDto, @ActorId() actor?: number) {
    return ok(await this.service.accept(id, dto, pickActor(actor, dto.changedByUserId)));
  }

  @Post(':id/return')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Pre-Sales Manager returns it to Sales with questions' })
  async returnToSales(@Param('id') id: string, @Body() dto: ReturnHandoffDto, @ActorId() actor?: number) {
    return ok(await this.service.returnToSales(id, dto.note, pickActor(actor, dto.changedByUserId)));
  }

  @Post(':id/resubmit')
  @HttpCode(HttpStatus.OK)
  async resubmit(@Param('id') id: string, @Body() dto: HandoffNoteDto, @ActorId() actor?: number) {
    return ok(await this.service.resubmit(id, dto.note, pickActor(actor, dto.changedByUserId)));
  }

  @Post(':id/complete')
  @HttpCode(HttpStatus.OK)
  async complete(@Param('id') id: string, @Body() dto: HandoffNoteDto, @ActorId() actor?: number) {
    return ok(await this.service.complete(id, dto.note, pickActor(actor, dto.changedByUserId)));
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  async cancel(@Param('id') id: string, @Body() dto: HandoffNoteDto, @ActorId() actor?: number) {
    return ok(await this.service.cancel(id, dto.note, pickActor(actor, dto.changedByUserId)));
  }
}
