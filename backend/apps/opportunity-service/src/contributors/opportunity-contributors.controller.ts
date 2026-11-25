import { Body, Controller, Get, Param, Patch } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId } from '../common/actor';
import { OpportunityContributorsService } from './opportunity-contributors.service';
import { UpdateContributorsDto } from './dto/update-contributors.dto';

@Controller('opportunities/:id/contributors')
export class OpportunityContributorsController {
  constructor(private readonly contributors: OpportunityContributorsService) {}

  @Get()
  async get(@Param('id') id: string) {
    return ok(await this.contributors.get(id));
  }

  @Patch()
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContributorsDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.contributors.update(id, dto, actor));
  }
}
