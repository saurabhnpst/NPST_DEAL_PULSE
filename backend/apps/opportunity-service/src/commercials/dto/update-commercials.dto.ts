import { Type } from 'class-transformer';
import { IsArray, IsOptional, ValidateNested } from 'class-validator';
import { RefIdField, TextField } from '../../common/validation';
import { CommercialLineDto } from './commercial-line.dto';

/** PATCH /opportunities/:id/commercials */
export class UpdateCommercialsDto {
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CommercialLineDto)
  lines?: CommercialLineDto[] | null;

  @TextField(32) licence?: string | null;
  @TextField(32) milestones?: string | null;
  @TextField(16) amcTerm?: string | null;

  /** Fallback when the `x-user-id` header is missing. */
  @RefIdField() changedByUserId?: number | null;
}

/** POST /opportunities/:id/commercials/versions */
export class SaveCommercialVersionDto {
  @TextField(128) versionLabel?: string | null;

  /** Fallback when the `x-user-id` header is missing. */
  @RefIdField() changedByUserId?: number | null;
}
