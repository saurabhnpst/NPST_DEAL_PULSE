import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OpportunityActivity } from './opportunity-activity.entity';
import { OpportunityCommercialHistory } from './opportunity-commercial-history.entity';
import { OpportunityProduct } from './opportunity-product.entity';
import { OpportunityStageHistory } from './opportunity-stage-history.entity';

export type StageTaskJson = {
  id: string;
  t: string;
  due: string;
  o: string;
  done: boolean;
  stage?: string;
  teamsAt?: string;
};

export type DealTeamMemberJson = {
  n: string;
  r: string;
  teamsAt?: string;
};

export type HoldFallbackJson = {
  kind: 'Fallback' | 'Reopened';
  by: string;
  at: string;
  plan: string;
  suggestion?: string;
  comment: string;
  stage?: string;
};

export type CommercialLineJson = {
  id: string;
  t: string;
  q: number;
  p: number[];
};

@Entity('opportunities')
export class Opportunity {
  @PrimaryGeneratedColumn({ type: 'bigint', unsigned: true })
  id: string;

  @Column({ name: 'public_id', type: 'varchar', length: 32, unique: true })
  publicId: string;

  @Column({ name: 'lead_id', type: 'bigint', unsigned: true, nullable: true })
  leadId: string | null;

  @Column({ name: 'account_id', type: 'bigint', unsigned: true, nullable: true })
  accountId: string | null;

  @Column({ name: 'account_name', type: 'varchar', length: 255 })
  accountName: string;

  @Column({ name: 'owner_user_id', type: 'bigint', unsigned: true, nullable: true })
  ownerUserId: string | null;

  @Column({ name: 'presales_user_id', type: 'bigint', unsigned: true, nullable: true })
  presalesUserId: string | null;

  @Column({ type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'record_type', type: 'varchar', length: 16, default: 'TSP' })
  recordType: string;

  @Column({ name: 'lead_source', type: 'varchar', length: 64, nullable: true })
  leadSource: string | null;

  @Column({ type: 'varchar', length: 32 })
  stage: string;

  @Column({ name: 'close_date', type: 'date' })
  closeDate: string;

  @Column({ name: 'followup_details', type: 'text', nullable: true })
  followupDetails: string | null;

  @Column({ name: 'updated_close_date', type: 'date', nullable: true })
  updatedCloseDate: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  region: string | null;

  @Column({ name: 'expected_po_date', type: 'date', nullable: true })
  expectedPoDate: string | null;

  @Column({ name: 'current_volume', type: 'varchar', length: 255, nullable: true })
  currentVolume: string | null;

  @Column({ name: 'updated_expected_po_date', type: 'date', nullable: true })
  updatedExpectedPoDate: string | null;

  @Column({ name: 'yearly_volume_projection', type: 'decimal', precision: 18, scale: 0, nullable: true })
  yearlyVolumeProjection: string | null;

  @Column({ name: 'project_start_expected', type: 'date', nullable: true })
  projectStartExpected: string | null;

  @Column({ name: 'spoc_first_name', type: 'varchar', length: 255, nullable: true })
  spocFirstName: string | null;

  @Column({ name: 'spoc_last_name', type: 'varchar', length: 255, nullable: true })
  spocLastName: string | null;

  @Column({ name: 'first_billing_expected', type: 'date', nullable: true })
  firstBillingExpected: string | null;

  @Column({ name: 'business_type', type: 'varchar', length: 32, nullable: true })
  businessType: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  territory: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  industry: string | null;

  @Column({ name: 'sub_industry', type: 'varchar', length: 128, nullable: true })
  subIndustry: string | null;

  @Column({ name: 'merchant_category', type: 'varchar', length: 255, nullable: true })
  merchantCategory: string | null;

  @Column({ name: 'account_size', type: 'varchar', length: 16, nullable: true })
  accountSize: string | null;

  @Column({ name: 'industry_remark', type: 'varchar', length: 255, nullable: true })
  industryRemark: string | null;

  @Column({ name: 'product_remark', type: 'varchar', length: 255, nullable: true })
  productRemark: string | null;

  @Column({ name: 'solution_type', type: 'varchar', length: 32, nullable: true })
  solutionType: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  hosting: string | null;

  @Column({ name: 'service_model', type: 'varchar', length: 32, nullable: true })
  serviceModel: string | null;

  @Column({ name: 'product_owner', type: 'varchar', length: 32, nullable: true })
  productOwner: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, default: 0 })
  arr: string;

  @Column({ name: 'one_time', type: 'decimal', precision: 18, scale: 2, default: 0 })
  oneTime: string;

  @Column({ name: 'updated_arr', type: 'decimal', precision: 18, scale: 2, nullable: true })
  updatedArr: string | null;

  @Column({ name: 'contract_years', type: 'varchar', length: 4, nullable: true })
  contractYears: string | null;

  @Column({ name: 'billing_frequency', type: 'varchar', length: 32, nullable: true })
  billingFrequency: string | null;

  @Column({ type: 'varchar', length: 8, default: 'INR' })
  currency: string;

  @Column({ name: 'compelling_event', type: 'varchar', length: 255, nullable: true })
  compellingEvent: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  tender: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  year2: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  year3: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  year4: string | null;

  @Column({ type: 'decimal', precision: 18, scale: 2, nullable: true })
  year5: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  transactions: string | null;

  @Column({ name: 'opp_type', type: 'varchar', length: 32, nullable: true })
  oppType: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  partner: string | null;

  @Column({ name: 'partner_name', type: 'varchar', length: 255, nullable: true })
  partnerName: string | null;

  @Column({ type: 'json', nullable: true })
  competitors: string[] | null;

  @Column({ name: 'competition_remarks', type: 'varchar', length: 255, nullable: true })
  competitionRemarks: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  today: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  implication: string | null;

  @Column({ name: 'present_pain', type: 'varchar', length: 255, nullable: true })
  presentPain: string | null;

  @Column({ name: 'pain_point', type: 'varchar', length: 255, nullable: true })
  painPoint: string | null;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @Column({ name: 'next_step', type: 'text', nullable: true })
  nextStep: string | null;

  @Column({ name: 'fy27_q1', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Q1: string | null;

  @Column({ name: 'fy27_jul', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Jul: string | null;

  @Column({ name: 'fy27_aug', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Aug: string | null;

  @Column({ name: 'fy27_sep', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Sep: string | null;

  @Column({ name: 'fy27_oct', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Oct: string | null;

  @Column({ name: 'fy27_nov', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Nov: string | null;

  @Column({ name: 'fy27_dec', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Dec: string | null;

  @Column({ name: 'fy27_jan', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Jan: string | null;

  @Column({ name: 'fy27_feb', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Feb: string | null;

  @Column({ name: 'fy27_mar', type: 'decimal', precision: 18, scale: 2, nullable: true })
  fy27Mar: string | null;

  @Column({ name: 'economic_buyer', type: 'varchar', length: 255, nullable: true })
  economicBuyer: string | null;

  @Column({ type: 'bool', default: false })
  champion: boolean;

  @Column({ type: 'bool', default: false })
  nda: boolean;

  @Column({ name: 'champion_ok', type: 'bool', default: false })
  championOk: boolean;

  @Column({ type: 'varchar', length: 255, nullable: true })
  strategy: string | null;

  @Column({ name: 'req_received', type: 'varchar', length: 8, nullable: true })
  reqReceived: string | null;

  @Column({ name: 'presales_involved', type: 'varchar', length: 8, nullable: true })
  presalesInvolved: string | null;

  @Column({ name: 'presales_name', type: 'varchar', length: 255, nullable: true })
  presalesName: string | null;

  @Column({ name: 'eb_aligned', type: 'varchar', length: 8, nullable: true })
  ebAligned: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  success: string | null;

  @Column({ name: 'eb_met', type: 'date', nullable: true })
  ebMet: string | null;

  @Column({ type: 'bool', default: false })
  poc: boolean;

  @Column({ name: 'demo_done', type: 'bool', default: false })
  demoDone: boolean;

  @Column({ type: 'varchar', length: 8, nullable: true })
  sow: string | null;

  @Column({ name: 'proposal_date', type: 'date', nullable: true })
  proposalDate: string | null;

  @Column({ name: 'criteria_known', type: 'bool', default: false })
  criteriaKnown: boolean;

  @Column({ name: 'latest_followup_date', type: 'date', nullable: true })
  latestFollowupDate: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  criteria: string | null;

  @Column({ name: 'contract_shared', type: 'varchar', length: 8, nullable: true })
  contractShared: string | null;

  @Column({ name: 'contract_signed', type: 'varchar', length: 8, nullable: true })
  contractSigned: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  discount: string | null;

  @Column({ name: 'sign_date', type: 'date', nullable: true })
  signDate: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  commercials: string | null;

  @Column({ name: 'bank_interview', type: 'varchar', length: 8, nullable: true })
  bankInterview: string | null;

  @Column({ type: 'varchar', length: 8, nullable: true })
  documentation: string | null;

  @Column({ name: 'bank_approval', type: 'varchar', length: 8, nullable: true })
  bankApproval: string | null;

  @Column({ name: 'uat_agreement', type: 'varchar', length: 8, nullable: true })
  uatAgreement: string | null;

  @Column({ name: 'po_received', type: 'varchar', length: 8, nullable: true })
  poReceived: string | null;

  @Column({ name: 'project_start_actual', type: 'date', nullable: true })
  projectStartActual: string | null;

  @Column({ name: 'first_billing_date', type: 'date', nullable: true })
  firstBillingDate: string | null;

  @Column({ name: 'po_date', type: 'date', nullable: true })
  poDate: string | null;

  @Column({ name: 'first_billing_value', type: 'decimal', precision: 18, scale: 2, nullable: true })
  firstBillingValue: string | null;

  @Column({ name: 'po_value', type: 'decimal', precision: 18, scale: 2, nullable: true })
  poValue: string | null;

  @Column({ name: 'closed_value', type: 'decimal', precision: 18, scale: 2, nullable: true })
  closedValue: string | null;

  @Column({ name: 'lost_reason', type: 'varchar', length: 64, nullable: true })
  lostReason: string | null;

  @Column({ name: 'lost_reason_remark', type: 'varchar', length: 255, nullable: true })
  lostReasonRemark: string | null;

  @Column({ name: 'hold_reason', type: 'varchar', length: 64, nullable: true })
  holdReason: string | null;

  @Column({ name: 'hold_details', type: 'text', nullable: true })
  holdDetails: string | null;

  @Column({ name: 'hold_until', type: 'date', nullable: true })
  holdUntil: string | null;

  @Column({ name: 'hold_from_stage', type: 'varchar', length: 32, nullable: true })
  holdFromStage: string | null;

  @Column({ name: 'hold_at', type: 'datetime', precision: 6, nullable: true })
  holdAt: Date | null;

  @Column({ name: 'reopened_at', type: 'datetime', precision: 6, nullable: true })
  reopenedAt: Date | null;

  @Column({ name: 'early_close', type: 'bool', default: false })
  earlyClose: boolean;

  @Column({ name: 'override_reason', type: 'varchar', length: 64, nullable: true })
  overrideReason: string | null;

  @Column({ name: 'override_justification', type: 'text', nullable: true })
  overrideJustification: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  licence: string | null;

  @Column({ type: 'varchar', length: 32, nullable: true })
  milestones: string | null;

  @Column({ name: 'amc_term', type: 'varchar', length: 16, nullable: true })
  amcTerm: string | null;

  @Column({ name: 'po_number', type: 'varchar', length: 64, nullable: true })
  poNumber: string | null;

  @Column({ name: 'po_file_document_id', type: 'bigint', unsigned: true, nullable: true })
  poFileDocumentId: string | null;

  @Column({ type: 'varchar', length: 128, nullable: true })
  tag: string | null;

  @Column({ type: 'varchar', length: 16, nullable: true })
  tone: string | null;

  @Column({ name: 'stage_tasks', type: 'json', nullable: true })
  stageTasks: StageTaskJson[] | null;

  @Column({ name: 'deal_team', type: 'json', nullable: true })
  dealTeam: DealTeamMemberJson[] | null;

  @Column({ name: 'hold_fallbacks', type: 'json', nullable: true })
  holdFallbacks: HoldFallbackJson[] | null;

  @Column({ name: 'current_commercial_lines', type: 'json', nullable: true })
  currentCommercialLines: CommercialLineJson[] | null;

  @Column({ name: 'created_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  createdByUserId: string | null;

  @Column({ name: 'last_modified_by_user_id', type: 'bigint', unsigned: true, nullable: true })
  lastModifiedByUserId: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'datetime', precision: 6 })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'datetime', precision: 6 })
  updatedAt: Date;

  @DeleteDateColumn({ name: 'deleted_at', type: 'datetime', precision: 6, nullable: true })
  deletedAt: Date | null;

  @OneToMany(() => OpportunityProduct, (p) => p.opportunity)
  products: OpportunityProduct[];

  @OneToMany(() => OpportunityStageHistory, (h) => h.opportunity)
  stageHistory: OpportunityStageHistory[];

  @OneToMany(() => OpportunityCommercialHistory, (c) => c.opportunity)
  commercialHistory: OpportunityCommercialHistory[];

  @OneToMany(() => OpportunityActivity, (a) => a.opportunity)
  activities: OpportunityActivity[];
}