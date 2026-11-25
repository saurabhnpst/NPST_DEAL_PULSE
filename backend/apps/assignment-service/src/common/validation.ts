import { applyDecorators } from '@nestjs/common';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * One-line field validators for DTOs. Each one also documents the field in Swagger.
 *
 * Optional helpers: missing = "not given / don't change", `null` = clear
 * (except where `nullable` is false).
 */

function optional(nullable: boolean) {
  return nullable ? IsOptional() : ValidateIf((_obj, value) => value !== undefined);
}

// ---- optional fields ----

export const TextField = (maxLength: number, nullable = true) =>
  applyDecorators(
    ApiPropertyOptional({ type: String, maxLength, nullable }),
    optional(nullable),
    IsString(),
    MaxLength(maxLength),
  );

/** TEXT columns (up to 64 KB). */
export const LongTextField = () =>
  applyDecorators(
    ApiPropertyOptional({ type: String, nullable: true }),
    optional(true),
    IsString(),
    MaxLength(65_000),
  );

/** YYYY-MM-DD */
export const DateField = (nullable = true) =>
  applyDecorators(
    ApiPropertyOptional({ type: String, format: 'date', nullable }),
    optional(nullable),
    IsDateString(),
  );

export const FlagField = () =>
  applyDecorators(ApiPropertyOptional({ type: Boolean }), optional(false), IsBoolean());

export const ChoiceField = (values: readonly string[], nullable = true) =>
  applyDecorators(
    ApiPropertyOptional({ enum: values, nullable }),
    optional(nullable),
    IsIn(values as string[]),
  );

/** Ids owned by other services (users). */
export const RefIdField = (description?: string) =>
  applyDecorators(
    ApiPropertyOptional({ type: Number, nullable: true, description }),
    optional(true),
    Type(() => Number),
    IsInt(),
    Min(1),
  );

/** A short list of strings, e.g. pending inputs or product names. */
export const TextListField = (maxItems: number, maxLength: number) =>
  applyDecorators(
    ApiPropertyOptional({ type: [String], nullable: true }),
    IsOptional(),
    IsArray(),
    ArrayMaxSize(maxItems),
    IsString({ each: true }),
    MaxLength(maxLength, { each: true }),
  );

// ---- required fields ----

export const RequiredText = (maxLength: number) =>
  applyDecorators(ApiProperty({ type: String, maxLength }), IsString(), IsNotEmpty(), MaxLength(maxLength));

export const RequiredRefId = (description?: string) =>
  applyDecorators(ApiProperty({ type: Number, description }), Type(() => Number), IsInt(), Min(1));

// ---- every action body ----

/** Fallback for who did it when the x-user-id header is missing (header wins). */
export class ActorDto {
  @RefIdField('Fallback when the x-user-id header is missing')
  changedByUserId?: number | null;
}
