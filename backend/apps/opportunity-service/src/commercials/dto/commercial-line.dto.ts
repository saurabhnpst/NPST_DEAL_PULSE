import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { MAX_AMOUNT } from '../../common/validation';

/** One row on the Commercials tab. `p` = unit price per version column. */
export class CommercialLineDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  id: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  t: string;

  @Type(() => Number)
  @IsNumber()
  @Min(1)
  q: number;

  @IsArray()
  @ArrayMinSize(1)
  @Type(() => Number)
  @IsNumber({}, { each: true })
  @Min(0, { each: true })
  @Max(MAX_AMOUNT, { each: true })
  p: number[];
}
