import { applyDecorators } from '@nestjs/common';
import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';

/**
 * One-line field validators for DTOs.
 *
 * Every helper makes the field optional (missing = "don't change it").
 * `null` clears the value, except where `nullable` is false
 * (columns that are NOT NULL in the database, e.g. name, arr, checkboxes).
 */

export const YES_NO = ['Yes', 'No'];

/** Largest value that fits in DECIMAL(18, 2). */
export const MAX_AMOUNT = 9_999_999_999_999_999;

function optional(nullable: boolean) {
  return nullable ? IsOptional() : ValidateIf((_obj, value) => value !== undefined);
}

export const TextField = (maxLength: number, nullable = true) =>
  applyDecorators(optional(nullable), IsString(), MaxLength(maxLength));

/** TEXT columns (up to 64 KB). */
export const LongTextField = () =>
  applyDecorators(optional(true), IsString(), MaxLength(65_000));

export const DateField = (nullable = true) =>
  applyDecorators(optional(nullable), IsDateString());

export const AmountField = (nullable = true) =>
  applyDecorators(
    optional(nullable),
    Type(() => Number),
    IsNumber(),
    Min(0),
    Max(MAX_AMOUNT),
  );

export const FlagField = () => applyDecorators(optional(false), IsBoolean());

export const ChoiceField = (values: readonly string[], nullable = true) =>
  applyDecorators(optional(nullable), IsIn(values as string[]));

export const YesNoField = () => ChoiceField(YES_NO);

/** Ids owned by other services (users, accounts, leads, documents). */
export const RefIdField = () =>
  applyDecorators(optional(true), Type(() => Number), IsInt(), Min(1));
