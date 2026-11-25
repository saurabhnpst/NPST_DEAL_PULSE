import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiQuery, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { SUBJECT } from '../common/statuses';
import { HistoryService } from '../history/history.service';
import { ProductVerticalsService } from './product-verticals.service';
import { CreateProductTechLeadDto, UpdateProductTechLeadDto } from './product-verticals.dto';

/** Product → vertical → default Tech Lead master (maintained by authorized users). */
@ApiTags('Product → Tech Lead master')
@ApiSecurity('x-user-id')
@Controller('product-verticals')
export class ProductVerticalsController {
  constructor(
    private readonly service: ProductVerticalsService,
    private readonly history: HistoryService,
  ) {}

  @Get()
  @ApiQuery({ name: 'activeOnly', required: false, type: Boolean })
  async list(@Query('activeOnly') activeOnly?: string) {
    return ok(await this.service.list(activeOnly === 'true'));
  }

  @Get(':id')
  async get(@Param('id') id: string) {
    return ok(await this.service.get(id));
  }

  @Get(':id/history')
  async getHistory(@Param('id') id: string) {
    await this.service.get(id);
    return ok(await this.history.list(SUBJECT.PRODUCT_TECH_LEAD, id));
  }

  @Post()
  async create(@Body() dto: CreateProductTechLeadDto, @ActorId() actor?: number) {
    return ok(await this.service.create(dto, pickActor(actor, dto.changedByUserId)));
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateProductTechLeadDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.service.update(id, dto, pickActor(actor, dto.changedByUserId)));
  }
}
