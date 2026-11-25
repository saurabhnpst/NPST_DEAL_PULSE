import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, MaxLength, ValidateNested } from 'class-validator';
import {
  AmountField,
  ChoiceField,
  DateField,
  FlagField,
  LongTextField,
  RefIdField,
  TextField,
  YesNoField,
} from '../../common/validation';
import { HOLD_REASONS, LOST_REASONS } from '../../stages/stage-definitions';
import { DealTeamMemberDto, StageTaskDto } from './stage-task.dto';

/**
 * Optional opportunity fields shared by create and update.
 * Max lengths match the column sizes in database/schema.sql.
 * Core fields (name, account, close date, currency, ARR, products) are declared
 * in CreateOpportunityDto (required) and UpdateOpportunityDto (optional).
 */
export class OpportunityFieldsDto {
  // ---- Opportunity information ----
  @RefIdField() ownerUserId?: number | null;
  @RefIdField() presalesUserId?: number | null;
  @RefIdField() accountId?: number | null;
  @RefIdField() leadId?: number | null;
  @TextField(16, false) recordType?: string;
  @TextField(64) leadSource?: string | null;
  @LongTextField() followupDetails?: string | null;
  @DateField() updatedCloseDate?: string | null;
  @TextField(32) region?: string | null;
  @DateField() expectedPoDate?: string | null;
  @TextField(255) currentVolume?: string | null;
  @DateField() updatedExpectedPoDate?: string | null;
  @AmountField() yearlyVolumeProjection?: number | null;
  @DateField() projectStartExpected?: string | null;
  @TextField(255) spocFirstName?: string | null;
  @TextField(255) spocLastName?: string | null;
  @DateField() firstBillingExpected?: string | null;
  @TextField(32) businessType?: string | null;
  @TextField(64) territory?: string | null;
  @TextField(128) tag?: string | null;
  @TextField(16) tone?: string | null;

  // ---- Industry information ----
  @TextField(64) industry?: string | null;
  @TextField(128) subIndustry?: string | null;
  @TextField(255) merchantCategory?: string | null;
  @TextField(16) accountSize?: string | null;
  @TextField(255) industryRemark?: string | null;

  // ---- Product description ----
  @TextField(255) productRemark?: string | null;
  @TextField(32) solutionType?: string | null;
  @TextField(32) hosting?: string | null;
  @TextField(32) serviceModel?: string | null;
  @TextField(32) productOwner?: string | null;

  // ---- Stage 1 · Qualification ----
  @AmountField() updatedArr?: number | null;
  @TextField(4) contractYears?: string | null;
  @TextField(32) billingFrequency?: string | null;
  @TextField(255) compellingEvent?: string | null;
  @TextField(32) tender?: string | null;
  @AmountField() year2?: number | null;
  @AmountField() year3?: number | null;
  @AmountField() year4?: number | null;
  @AmountField() year5?: number | null;
  @TextField(255) transactions?: string | null;
  @TextField(32) oppType?: string | null;
  @YesNoField() partner?: string | null;
  @TextField(255) partnerName?: string | null;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(64, { each: true })
  competitors?: string[] | null;

  @TextField(255) competitionRemarks?: string | null;
  @TextField(255) today?: string | null;
  @TextField(255) implication?: string | null;
  @TextField(255) presentPain?: string | null;
  @TextField(255) painPoint?: string | null;
  @LongTextField() notes?: string | null;
  @LongTextField() nextStep?: string | null;

  // FY27 revenue phasing (Q1 is entered directly; Q2–Q4 by month)
  @AmountField() fy27Q1?: number | null;
  @AmountField() fy27Jul?: number | null;
  @AmountField() fy27Aug?: number | null;
  @AmountField() fy27Sep?: number | null;
  @AmountField() fy27Oct?: number | null;
  @AmountField() fy27Nov?: number | null;
  @AmountField() fy27Dec?: number | null;
  @AmountField() fy27Jan?: number | null;
  @AmountField() fy27Feb?: number | null;
  @AmountField() fy27Mar?: number | null;

  // ---- Stage 2 · Needs Analysis ----
  @TextField(255) economicBuyer?: string | null;
  @FlagField() champion?: boolean;
  @FlagField() nda?: boolean;
  @FlagField() championOk?: boolean;
  @TextField(255) strategy?: string | null;
  @YesNoField() reqReceived?: string | null;
  @YesNoField() presalesInvolved?: string | null;
  @TextField(255) presalesName?: string | null;

  // ---- Stage 3 · Impact Analysis ----
  @YesNoField() ebAligned?: string | null;
  @TextField(255) success?: string | null;
  @DateField() ebMet?: string | null;
  @FlagField() poc?: boolean;
  @FlagField() demoDone?: boolean;
  @YesNoField() sow?: string | null;

  // ---- Stage 4 · Proposal ----
  @DateField() proposalDate?: string | null;
  @FlagField() criteriaKnown?: boolean;
  @DateField() latestFollowupDate?: string | null;
  @TextField(255) criteria?: string | null;

  // ---- Stage 5 · Negotiation ----
  @YesNoField() contractShared?: string | null;
  @YesNoField() contractSigned?: string | null;
  @TextField(255) discount?: string | null;
  @DateField() signDate?: string | null;
  @YesNoField() commercials?: string | null;
  @YesNoField() bankInterview?: string | null;
  @YesNoField() documentation?: string | null;
  @YesNoField() bankApproval?: string | null;
  @YesNoField() uatAgreement?: string | null;
  @YesNoField() poReceived?: string | null;

  // ---- Stage 6 · Closed Won ----
  @DateField() projectStartActual?: string | null;
  @DateField() firstBillingDate?: string | null;
  @DateField() poDate?: string | null;
  @AmountField() firstBillingValue?: number | null;
  @AmountField() poValue?: number | null;

  // ---- Stage 7 · Closed Lost ----
  @ChoiceField(LOST_REASONS) lostReason?: string | null;
  @TextField(255) lostReasonRemark?: string | null;

  // ---- On Hold ----
  @ChoiceField(HOLD_REASONS) holdReason?: string | null;
  @LongTextField() holdDetails?: string | null;
  @DateField() holdUntil?: string | null;

  // ---- Side panels ----
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StageTaskDto)
  stageTasks?: StageTaskDto[] | null;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DealTeamMemberDto)
  dealTeam?: DealTeamMemberDto[] | null;
}
