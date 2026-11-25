import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { AmountField, ChoiceField, MAX_AMOUNT } from '../../common/validation';
import { OPEN_STAGES } from '../../stages/stage-definitions';
import { OpportunityFieldsDto } from './opportunity-fields.dto';
import { OpportunityProductDto } from './opportunity-product.dto';

export const CURRENCIES = ['INR', 'USD'];

/** POST /opportunities: core fields required, every other field optional. */
export class CreateOpportunityDto extends OpportunityFieldsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  accountName: string;

  /** Defaults to Qualification. Only open stages are allowed on create. */
  @IsOptional()
  @IsIn(OPEN_STAGES)
  stage?: string;

  @IsDateString()
  closeDate: string;

  /** Defaults to INR. */
  @ChoiceField(CURRENCIES, false)
  currency?: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(MAX_AMOUNT)
  arr: number;

  @AmountField(false)
  oneTime?: number;

  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(4)
  @ValidateNested({ each: true })
  @Type(() => OpportunityProductDto)
  products: OpportunityProductDto[];
}
