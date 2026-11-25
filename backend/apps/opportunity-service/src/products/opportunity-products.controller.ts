import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { ok } from '../common/api-response';
import { ActorId } from '../common/actor';
import { OpportunityProductsService } from './opportunity-products.service';
import { ReplaceProductsDto } from './dto/replace-products.dto';

@Controller('opportunities/:id/products')
export class OpportunityProductsController {
  constructor(private readonly products: OpportunityProductsService) {}

  @Get()
  async list(@Param('id') id: string) {
    return ok(await this.products.list(id));
  }

  @Put()
  async replace(
    @Param('id') id: string,
    @Body() dto: ReplaceProductsDto,
    @ActorId() actor?: number,
  ) {
    return ok(await this.products.replace(id, dto, actor));
  }
}
