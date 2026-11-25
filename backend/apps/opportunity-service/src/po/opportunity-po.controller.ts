import { Body, Controller, HttpCode, HttpStatus, Param, Post } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId, pickActor } from '../common/actor';
import { OpportunityPoService } from './opportunity-po.service';
import { PoReceiptDto } from './dto/po-receipt.dto';

@Controller('opportunities/:id')
export class OpportunityPoController {
  constructor(private readonly po: OpportunityPoService) {}

  @Post('po-receipt')
  @HttpCode(HttpStatus.OK)
  async saveReceipt(
    @Param('id') id: string,
    @Body() dto: PoReceiptDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.po.saveReceipt(id, dto, pickActor(actor, dto.changedByUserId)));
  }
}
