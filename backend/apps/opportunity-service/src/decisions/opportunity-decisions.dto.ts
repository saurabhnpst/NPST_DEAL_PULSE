import { IsIn, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

/** Sales recommendation sent to the P&L Head. */
export class RecommendDto {
  @IsString() @IsNotEmpty() oppId: string;
  @IsIn(['Yes', 'No']) rec: string;
  @IsString() @IsNotEmpty() @MaxLength(4000) syn: string;
  @IsOptional() @IsString() @MaxLength(4000) concern?: string;
  @IsOptional() @IsString() @MaxLength(255) prop?: string;
}

/** P&L Head decision. Reject needs a note. */
export class DecideDto {
  @IsIn(['Proceed', 'Reject']) v: string;
  @IsOptional() @IsString() @MaxLength(4000) note?: string;
}
