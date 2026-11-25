import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsOptional,
  ValidateNested,
} from 'class-validator';
import { AmountField, ChoiceField, DateField, TextField } from '../../common/validation';
import { CURRENCIES } from './create-opportunity.dto';
import { OpportunityFieldsDto } from './opportunity-fields.dto';
import { OpportunityProductDto } from './opportunity-product.dto';

/**
 * PATCH /opportunities/:id: send only what changed.
 * Missing field = unchanged, `null` = cleared (core fields below cannot be cleared).
 * Stage is not editable here; use the stage endpoints.
 */
export class UpdateOpportunityDto extends OpportunityFieldsDto {
  @TextField(120, false) name?: string;
  @TextField(255, false) accountName?: string;
  @DateField(false) closeDate?: string;
  @ChoiceField(CURRENCIES, false) currency?: string;
  @AmountField(false) arr?: number;
  @AmountField(false) oneTime?: number;

  /** Replaces all product slots when present. */
  @IsOptional()
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => OpportunityProductDto)
  products?: OpportunityProductDto[];
}
