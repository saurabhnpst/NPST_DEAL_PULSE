import { Injectable } from '@nestjs/common';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { ReplaceProductsDto } from './dto/replace-products.dto';

/** Product slots 1–4. Writes go through OpportunitiesService.update (validated there). */
@Injectable()
export class OpportunityProductsService {
  constructor(private readonly opportunities: OpportunitiesService) {}

  async list(id: string) {
    const { products } = await this.opportunities.findOne(id);
    return products;
  }

  async replace(id: string, dto: ReplaceProductsDto, actorId?: number) {
    const { products } = await this.opportunities.update(id, { products: dto.products }, actorId);
    return products;
  }
}
