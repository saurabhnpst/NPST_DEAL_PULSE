import { Controller, Get, Param } from '@nestjs/common';
import { ok } from '../common/api-response';
import { OpportunityHistoryService } from './opportunity-history.service';

/**
 * Unified timeline (stage transitions + user activities).
 * Replaces the stage-only history listing for product use-cases.
 */
@Controller('opportunities/:id/history')
export class OpportunityHistoryController {
  constructor(private readonly history: OpportunityHistoryService) {}

  @Get()
  async timeline(@Param('id') id: string) {
    return ok(await this.history.timeline(id));
  }
}