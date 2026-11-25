import { IsNotEmpty, IsString, MaxLength } from 'class-validator';
import { RefIdField, TextField } from '../../common/validation';

/** PATCH /opportunities/:id/fallback */
export class SaveFallbackDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  plan: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  comment: string;

  @TextField(2000) suggestion?: string | null;

  /** Fallback when the `x-user-id` header is missing. */
  @RefIdField() changedByUserId?: number | null;
}
