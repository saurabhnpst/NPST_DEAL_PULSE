import { Type } from 'class-transformer';
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { OpportunityActivityKind } from '../../entities/opportunity-activity.entity';

const KINDS: OpportunityActivityKind[] = ['Call', 'Meeting', 'Email', 'Note', 'System'];

export class CreateActivityDto {
  @IsIn(KINDS)
  activityKind: OpportunityActivityKind;

  @IsString()
  @IsNotEmpty()
  summary: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  withParty?: string;

  @IsOptional()
  @IsDateString()
  occurredAt?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  actorUserId?: number;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  actorLabel?: string;
}