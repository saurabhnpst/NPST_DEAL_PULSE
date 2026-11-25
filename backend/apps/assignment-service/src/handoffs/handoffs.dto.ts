import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import {
  ActorDto,
  ChoiceField,
  DateField,
  LongTextField,
  RefIdField,
  RequiredText,
  TextField,
  TextListField,
} from '../common/validation';
import { HANDOFF_STATUS } from '../common/statuses';

/** POST /handoffs: Sales asks Pre-Sales/Solution for support. */
export class CreateHandoffDto extends ActorDto {
  @RequiredText(255) title: string;
  /** OPP-YYYY-NNNNN, when the opportunity already exists. */
  @TextField(32) opportunityId?: string | null;
  @TextField(32) leadId?: string | null;
  @TextField(32) synopsisId?: string | null;
  @LongTextField() requestedSupport?: string | null;
  @DateField() dueDate?: string | null;
  /** Inputs still missing, e.g. ["Signed NDA"]. */
  @TextListField(50, 255) pendingInputs?: string[] | null;
  /** Suggested Pre-Sales owner (can be decided on accept). */
  @RefIdField('Suggested Pre-Sales / Solutions owner') assigneeUserId?: number | null;
}

/** PATCH /handoffs/:id: update details (e.g. link the opportunity once it is created). */
export class UpdateHandoffDto extends ActorDto {
  @TextField(255, false) title?: string;
  @TextField(32) opportunityId?: string | null;
  @LongTextField() requestedSupport?: string | null;
  @DateField() dueDate?: string | null;
  @TextListField(50, 255) pendingInputs?: string[] | null;
}

/** POST /handoffs/:id/accept: Pre-Sales Manager accepts and names the Solutions owner. */
export class AcceptHandoffDto extends ActorDto {
  /** Required unless the handoff already has an assignee. */
  @RefIdField('Pre-Sales / Solutions owner') assigneeUserId?: number | null;
  /** OPP-YYYY-NNNNN, e.g. the opportunity created by accepting the synopsis. */
  @TextField(32) opportunityId?: string | null;
}

/** POST /handoffs/:id/return: back to Sales with questions. */
export class ReturnHandoffDto extends ActorDto {
  @RequiredText(2000) note: string;
}

/** POST /handoffs/:id/resubmit | complete | cancel */
export class HandoffNoteDto extends ActorDto {
  @LongTextField() note?: string | null;
}

/** GET /handoffs filters. */
export class ListHandoffsQueryDto {
  @TextField(32) opportunityId?: string;
  @RefIdField() assigneeUserId?: number;
  @ChoiceField(Object.values(HANDOFF_STATUS)) status?: string;

  @ApiPropertyOptional({ default: 1 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1)
  page?: number;

  @ApiPropertyOptional({ default: 50, maximum: 200 })
  @IsOptional() @Type(() => Number) @IsInt() @Min(1) @Max(200)
  limit?: number;
}
