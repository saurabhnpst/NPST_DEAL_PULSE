import { IsIn, IsOptional, IsString } from 'class-validator';
import { LOST_REASONS, OVERRIDE_REASONS } from '../stage-definitions';
import { StageActorDto } from './stage-actor.dto';

export class CloseLostDto extends StageActorDto {
  @IsIn(LOST_REASONS)
  lostReason: string;

  @IsOptional()
  @IsString()
  lostReasonRemark?: string;

  @IsOptional()
  @IsIn(OVERRIDE_REASONS)
  overrideReason?: string;

  @IsOptional()
  @IsString()
  overrideJustification?: string;
}