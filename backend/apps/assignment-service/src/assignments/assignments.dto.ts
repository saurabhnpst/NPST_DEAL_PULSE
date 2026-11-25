import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsInt,
  IsOptional,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';
import {
  ActorDto,
  ChoiceField,
  LongTextField,
  RefIdField,
  RequiredRefId,
  RequiredText,
  TextField,
  TextListField,
} from '../common/validation';
import { TECH_STATUS } from '../common/statuses';

/** One RFP requirement, as sent by the RFP Service (or by hand). */
export class RequirementInputDto {
  /** RFP clause / requirement number. Re-sending the same ref for an opportunity is ignored. */
  @TextField(64) requirementRef?: string | null;
  @RequiredText(255) title: string;
  @LongTextField() details?: string | null;
  /** The mapped NPST product, e.g. "UPI". Leave empty when unknown. */
  @TextField(128) productTsp?: string | null;
  /** Use instead of productTsp when the requirement maps to several products (goes to review). */
  @TextListField(10, 128) products?: string[] | null;
}

/** POST /assignments/opportunity/:opportunityId/requirements */
export class AddRequirementsDto extends ActorDto {
  @ApiProperty({ type: [RequirementInputDto] })
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(500)
  @ValidateNested({ each: true })
  @Type(() => RequirementInputDto)
  requirements: RequirementInputDto[];
}

/** POST /assignments/opportunity/:opportunityId: propose a Tech Lead by hand (e.g. no default in the master). */
export class ManualProposalDto extends ActorDto {
  @RequiredText(128) productTsp: string;
  @RequiredRefId('Proposed Tech Lead (Auth user id)') techLeadUserId: number;
  @LongTextField() comment?: string | null;
}

/** POST /assignments/:id/approve */
export class ApproveDto extends ActorDto {
  @LongTextField() comment?: string | null;
}

/** POST /assignments/:id/change: propose a different Tech Lead (needs approval again). */
export class ChangeTechLeadDto extends ActorDto {
  @RequiredRefId('New proposed Tech Lead (Auth user id)') techLeadUserId: number;
  @LongTextField() comment?: string | null;
}

/** POST /assignments/:id/return: return / reject the proposal (reason required). */
export class ReturnDto extends ActorDto {
  @RequiredText(2000) comment: string;
}

/** PATCH /requirements/:id: set (or clear) the requirement's product from the review queue. */
export class MapRequirementDto extends ActorDto {
  /** Product name, or null to mark it "not mapped". */
  @TextField(128) productTsp: string | null;
}

/** GET /assignments filters. */
export class ListAssignmentsQueryDto {
  @TextField(32) opportunityId?: string;
  @ChoiceField(Object.values(TECH_STATUS)) status?: string;
  @TextField(128) productTsp?: string;
  /** Final or proposed Tech Lead. */
  @RefIdField() techLeadUserId?: number;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  limit?: number;
}
