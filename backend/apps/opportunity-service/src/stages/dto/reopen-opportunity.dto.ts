import { IsIn, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { OPEN_STAGES } from '../stage-definitions';
import { StageActorDto } from './stage-actor.dto';

export class ReopenOpportunityDto extends StageActorDto {
  @IsIn(OPEN_STAGES)
  stage: string;

  @IsString()
  @IsNotEmpty()
  plan: string;

  @IsString()
  @IsNotEmpty()
  comment: string;

  @IsOptional()
  @IsString()
  suggestion?: string;
}