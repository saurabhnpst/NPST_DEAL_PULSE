import { IsDateString, IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { HOLD_REASONS } from '../stage-definitions';
import { StageActorDto } from './stage-actor.dto';

export class HoldOpportunityDto extends StageActorDto {
  @IsIn(HOLD_REASONS)
  holdReason: string;

  @IsString()
  @IsNotEmpty()
  holdDetails: string;

  @IsOptional()
  @IsDateString()
  holdUntil?: string;
}