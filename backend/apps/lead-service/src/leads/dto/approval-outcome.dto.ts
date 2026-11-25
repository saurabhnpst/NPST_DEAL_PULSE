import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

/** Opportunity created for an RFP lead when Pre-Sales accepts the synopsis. */
export class LinkOpportunityDto {
  @ApiProperty({ example: 'OPP-2026-00012' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(32)
  opportunityId: string;
}

/** Reason for rejecting a lead in approval (required). */
export class RejectLeadDto {
  @ApiProperty({ description: 'Why the approver rejected the lead' })
  @IsString()
  @IsNotEmpty()
  @MaxLength(2000)
  reason: string;
}
