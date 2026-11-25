import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId } from '../common/actor';
import { OpportunityRevenueService } from './opportunity-revenue.service';
import { UpdateRevenueDto } from './dto/update-revenue.dto';

@Controller('opportunities/:id/revenue')
export class OpportunityRevenueController {
  constructor(private readonly revenue: OpportunityRevenueService) {}

  @Get()
  async get(@Param('id') id: string) {
    return ok(await this.revenue.get(id));
  }

  @Patch()
  async patch(
    @Param('id') id: string,
    @Body() dto: UpdateRevenueDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.revenue.update(id, dto, actor));
  }
}
