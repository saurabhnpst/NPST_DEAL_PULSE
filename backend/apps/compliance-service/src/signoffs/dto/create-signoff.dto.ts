import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { SignoffDecision } from '../../common/enums/signoff-decision.enum';

export class CreateSignoffDto {
  @ApiProperty({
    enum: SignoffDecision,
    example: SignoffDecision.SIGNED_OFF,
    description:
      'SIGNED_OFF requires matrix readiness and at least one submitted APPROVED review. REJECTED requires at least one submitted review.',
  })
  @IsEnum(SignoffDecision)
  decision: SignoffDecision;

  @ApiPropertyOptional({
    example: 'Compliance matrix complete; proceeding to commercial closure.',
  })
  @IsOptional()
  @IsString()
  comments?: string;

  @ApiPropertyOptional({
    description: 'Sign-off timestamp (defaults to server time when omitted)',
    example: '2026-11-23T10:30:00.000Z',
  })
  @IsOptional()
  @IsDateString()
  signedOffAt?: string;
}