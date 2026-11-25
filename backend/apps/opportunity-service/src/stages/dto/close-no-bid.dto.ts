import { IsIn, IsOptional, IsString } from 'class-validator';
import { OVERRIDE_REASONS } from '../stage-definitions';
import { StageActorDto } from './stage-actor.dto';

export class CloseNoBidDto extends StageActorDto {
  @IsOptional()
  @IsIn(OVERRIDE_REASONS)
  overrideReason?: string;

  @IsOptional()
  @IsString()
  overrideJustification?: string;
}