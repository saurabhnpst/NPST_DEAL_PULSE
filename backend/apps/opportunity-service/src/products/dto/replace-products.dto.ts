import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { OpportunityProductDto } from '../../opportunities/dto/opportunity-product.dto';

export class ReplaceProductsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => OpportunityProductDto)
  products: OpportunityProductDto[];
}