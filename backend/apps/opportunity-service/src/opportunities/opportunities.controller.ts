import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { CreateOpportunityDto } from './dto/create-opportunity.dto';
import { UpdateOpportunityDto } from './dto/update-opportunity.dto';
import { ListOpportunitiesQueryDto } from './dto/list-opportunities-query.dto';
import { OpportunitiesService } from './opportunities.service';
import { OpportunityPipelineService } from '../pipeline/opportunity-pipeline.service';

@Controller('opportunities')
export class OpportunitiesController {
  constructor(
    private readonly opportunities: OpportunitiesService,
    private readonly pipeline: OpportunityPipelineService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateOpportunityDto, @ActorId() actor?: number) {
    const data = await this.opportunities.create(dto, actor);
    return ok(data);
  }

  @Get('pipeline')
  async pipelineSummary() {
    return ok(await this.pipeline.summary());
  }

  @Get()
  async list(@Query() query: ListOpportunitiesQueryDto) {
    const { items, total, page, limit } = await this.opportunities.findAll(query);
    const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
    return ok(items, { page, limit, total, totalPages });
  }

  @Get(':id')
  async getOne(@Param('id') id: string) {
    const data = await this.opportunities.findOne(id);
    return ok(data);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateOpportunityDto,
    @ActorId() actor?: number,
  ) {
    const data = await this.opportunities.update(id, dto, actor);
    return ok(data);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async remove(@Param('id') id: string, @ActorId() actor?: number) {
    const data = await this.opportunities.softDelete(id, actor);
    return ok(data);
  }
}