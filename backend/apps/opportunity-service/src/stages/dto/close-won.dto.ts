import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { OVERRIDE_REASONS } from '../stage-definitions';
import { StageActorDto } from './stage-actor.dto';

export class CloseWonDto extends StageActorDto {
  @IsDateString()
  poDate: string;

  @Type(() => Number)
  @IsNumber()
  @Min(0.01)
  poValue: number;

  @IsOptional()
  @IsDateString()
  projectStartActual?: string;

  @IsOptional()
  @IsDateString()
  firstBillingDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  firstBillingValue?: number;

  @IsOptional()
  @IsIn(OVERRIDE_REASONS)
  overrideReason?: string;

  @IsOptional()
  @IsString()
  overrideJustification?: string;
}