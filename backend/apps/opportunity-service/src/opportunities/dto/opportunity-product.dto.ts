import { Type } from 'class-transformer';
import {
  IsArray,
  IsInt,
  IsNotEmpty,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class OpportunityProductDto {
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(4)
  productSlot: number;

  @IsString()
  @IsNotEmpty()
  productTsp: string;

  @IsArray()
  @IsString({ each: true })
  modules: string[] = [];
}