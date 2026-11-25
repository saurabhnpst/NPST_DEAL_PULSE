 import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';
 
import { LeadQualification } from './lead-qualification.entity';
import { LeadHistory } from './lead-history.entity';
 
@Entity('leads')
export class Lead {
  @PrimaryGeneratedColumn('uuid')
  id: string;
 
  // Lead Information
  @Column({ length: 40, nullable: true })
  salutation: string;
 
  @Column({ name: 'first_name', length: 40, nullable: true })
  firstName: string;
 
  @Column({ name: 'middle_name', length: 40, nullable: true })
  middleName: string;
 
  @Column({ name: 'last_name', length: 80, nullable: true })
  lastName: string;
 
  @Column({ length: 40, nullable: true })
  suffix: string;
 
  @Column({ length: 255, nullable: true })
  company: string;
 
  @Column({ length: 128, nullable: true })
  title: string;
 
  @Column({ length: 255, nullable: true })
  website: string;
 
  @Column({ length: 255, nullable: true })
  email: string;
 
  @Column({ length: 30, nullable: true })
  phone: string;
 
  @Column({ name: 'mobile_phone', length: 30, nullable: true })
  mobilePhone: string;
 
  @Column({ length: 30, nullable: true })
  fax: string;
 
  @Column({ length: 255, nullable: true })
  designation: string;
 
  @Column({ name: 'record_type_id', length: 100, nullable: true })
  recordTypeId: string;
 
  @Column({ name: 'lead_record_type', length: 255, nullable: true })
  leadRecordType: string;
 
  // Lead Source and Status
  @Column({ name: 'lead_source', length: 255, nullable: true })
  leadSource: string;
 
  @Column({ name: 'lead_source_other_remark', length: 255, nullable: true })
  leadSourceOtherRemark: string;
 
  @Column({ length: 100, default: 'New' })
  status: string;
 
  @Column({ length: 100, nullable: true })
  rating: string;
 
  @Column({ length: 255, nullable: true })
  vertical: string;
 
  @Column({ name: 'approval_stage', length: 255, nullable: true })
  approvalStage: string;
 
  @Column({ name: 'lead_lost_reason', length: 255, nullable: true })
  leadLostReason: string;
 
  @Column({ name: 'disqualification_reason', length: 255, nullable: true })
  disqualificationReason: string;
 
  @Column({ name: 'disqualification_remark', length: 255, nullable: true })
  disqualificationRemark: string;
 
  // Ownership
  @Column({ name: 'owner_id', length: 100, nullable: true })
  ownerId: string;
 
  @Column({ name: 'created_by_id', length: 100, nullable: true })
  createdById: string;
 
  @Column({ name: 'last_modified_by_id', length: 100, nullable: true })
  lastModifiedById: string;
 
  // SPOC Details
  @Column({ name: 'spoc_first_name', length: 255, nullable: true })
  spocFirstName: string;
 
  @Column({ name: 'spoc_last_name', length: 255, nullable: true })
  spocLastName: string;
 
  @Column({ name: 'spoc_designation', length: 255, nullable: true })
  spocDesignation: string;
 
  @Column({ name: 'spoc_email_id', length: 255, nullable: true })
  spocEmailId: string;
 
  @Column({ name: 'spoc_contact_number', length: 30, nullable: true })
  spocContactNumber: string;
 
  // Product Details
  @Column({ name: 'product', length: 255, nullable: true })
  product: string;
 
  @Column({ name: 'product_vertical_new', length: 255, nullable: true })
  productVerticalNew: string;
 
  @Column({ name: 'product_vertical_old', length: 255, nullable: true })
  productVerticalOld: string;
 
  @Column({ name: 'product_tsp', length: 255, nullable: true })
  productTsp: string;
 
  @Column({ name: 'product_tsp_2', length: 255, nullable: true })
  productTsp2: string;
 
  @Column({ name: 'product_tsp_3', length: 255, nullable: true })
  productTsp3: string;
 
  @Column({ name: 'product_tsp_4', length: 255, nullable: true })
  productTsp4: string;
 
  @Column({ name: 'product_tsp_other_remark', length: 255, nullable: true })
  productTspOtherRemark: string;
 
  @Column({ name: 'product_ppas', type: 'json', nullable: true })
  productPpas: string[];
 
  @Column({ name: 'sub_products_tsp', type: 'json', nullable: true })
  subProductsTsp: string[];
 
  @Column({ name: 'module_upi', type: 'json', nullable: true })
  moduleUpi: string[];
 
  @Column({ name: 'module_upi_2', type: 'json', nullable: true })
  moduleUpi2: string[];
 
  @Column({ name: 'module_upi_3', type: 'json', nullable: true })
  moduleUpi3: string[];
 
  @Column({ name: 'module_upi_4', type: 'json', nullable: true })
  moduleUpi4: string[];
 
  @Column({ name: 'module_qynx', type: 'json', nullable: true })
  moduleQynx: string[];
 
  @Column({ name: 'module_qynx_2', type: 'json', nullable: true })
  moduleQynx2: string[];
 
  @Column({ name: 'module_qynx_3', type: 'json', nullable: true })
  moduleQynx3: string[];
 
  @Column({ name: 'module_qynx_4', type: 'json', nullable: true })
  moduleQynx4: string[];
 
  @Column({ name: 'module_imps', type: 'json', nullable: true })
  moduleImps: string[];
 
  @Column({ name: 'module_imps_2', type: 'json', nullable: true })
  moduleImps2: string[];
 
  @Column({ name: 'module_imps_3', type: 'json', nullable: true })
  moduleImps3: string[];
 
  @Column({ name: 'module_imps_4', type: 'json', nullable: true })
  moduleImps4: string[];
 
  @Column({ name: 'module_erp', type: 'json', nullable: true })
  moduleErp: string[];
 
  @Column({ name: 'module_erp_2', type: 'json', nullable: true })
  moduleErp2: string[];
 
  @Column({ name: 'module_erp_3', type: 'json', nullable: true })
  moduleErp3: string[];
 
  @Column({ name: 'module_erp_4', type: 'json', nullable: true })
  moduleErp4: string[];
 
  @Column({ name: 'module_bbps', type: 'json', nullable: true })
  moduleBbps: string[];
 
  @Column({ name: 'module_bbps_2', type: 'json', nullable: true })
  moduleBbps2: string[];
 
  @Column({ name: 'module_bbps_3', type: 'json', nullable: true })
  moduleBbps3: string[];
 
  @Column({ name: 'module_bbps_4', type: 'json', nullable: true })
  moduleBbps4: string[];
 
  // Industry and Company Details
  @Column({ name: 'industry', length: 255, nullable: true })
  industry: string;
 
  @Column({ name: 'industry_custom', type: 'json', nullable: true })
  industryCustom: string[];
 
  @Column({ name: 'industry_remark', length: 255, nullable: true })
  industryRemark: string;
 
  @Column({ name: 'sub_industry', length: 255, nullable: true })
  subIndustry: string;
 
  @Column({ name: 'sub_industry_remark', length: 255, nullable: true })
  subIndustryRemark: string;
 
  @Column({ length: 255, nullable: true })
  category: string;
 
  @Column({ name: 'merchant_categories', length: 255, nullable: true })
  merchantCategories: string;
 
  @Column({ name: 'company_profile', length: 255, nullable: true })
  companyProfile: string;
 
  @Column({ name: 'current_yearly_volume', length: 255, nullable: true })
  currentYearlyVolume: string;
 
  @Column({
    name: 'yearly_volume_projection',
    type: 'decimal',
    precision: 18,
    scale: 0,
    nullable: true,
  })
  yearlyVolumeProjection: string;
 
  @Column({
    name: 'annual_revenue',
    type: 'decimal',
    precision: 18,
    scale: 0,
    nullable: true,
  })
  annualRevenue: string;
 
  @Column({ name: 'number_of_employees', type: 'int', nullable: true })
  numberOfEmployees: number;
 
  // Referral and Event Details
  @Column({ name: 'account_source_evoke', length: 255, nullable: true })
  accountSourceEvoke: string;
 
  @Column({ name: 'account_source_tsp', length: 255, nullable: true })
  accountSourceTsp: string;
 
  @Column({ name: 'partner_referral', length: 255, nullable: true })
  partnerReferral: string;
 
  @Column({ name: 'partner_referral_other_remarks', length: 255, nullable: true })
  partnerReferralOtherRemarks: string;
 
  @Column({ name: 'employee_referral', length: 255, nullable: true })
  employeeReferral: string;
 
  @Column({ name: 'customer_referral', length: 255, nullable: true })
  customerReferral: string;
 
  @Column({ length: 255, nullable: true })
  event: string;
 
  @Column({ name: 'event_other_remarks', length: 255, nullable: true })
  eventOtherRemarks: string;
 
  @Column({ length: 255, nullable: true })
  documentation: string;
 
  @Column({ length: 255, nullable: true })
  feedback: string;
 
  @Column({ name: 'feedback_from_presales', length: 255, nullable: true })
  feedbackFromPresales: string;
 
  // Other Salesforce fields
  @Column({ length: 20, nullable: true })
  jigsaw: string;
 
  @Column({ length: 100, nullable: true })
  pronouns: string;
 
  @Column({ name: 'gender_identity', length: 100, nullable: true })
  genderIdentity: string;
 
  @Column({ name: 'flag_value', length: 255, nullable: true })
  flagValue: string;
 
  @Column({ name: 'tsp_product_formula', length: 255, nullable: true })
  tspProductFormula: string;
 
  @Column({ name: 'evok_product_formula', length: 255, nullable: true })
  evokProductFormula: string;
 
  @Column({ name: 'age', type: 'int', nullable: true })
  age: number;
 
  // Address
  @Column({ type: 'text', nullable: true })
  street: string;
 
  @Column({ length: 100, nullable: true })
  city: string;
 
  @Column({ length: 100, nullable: true })
  state: string;
 
  @Column({ name: 'postal_code', length: 20, nullable: true })
  postalCode: string;
 
  @Column({ length: 100, nullable: true })
  country: string;
 
  // Remarks
  @Column({ name: 'additional_remarks', type: 'mediumtext', nullable: true })
  additionalRemarks: string;
 
  @Column({ type: 'mediumtext', nullable: true })
  description: string;
 
  // Checkbox fields
  @Column({ name: 'has_opted_out_of_fax', type: 'boolean', default: false })
  hasOptedOutOfFax: boolean;
 
  @Column({ name: 'has_opted_out_of_email', type: 'boolean', default: false })
  hasOptedOutOfEmail: boolean;
 
  @Column({ name: 'do_not_call', type: 'boolean', default: false })
  doNotCall: boolean;
 
  @Column({ type: 'boolean', default: false })
  converting: boolean;
 
  @Column({ type: 'boolean', default: false })
  approved: boolean;

  /** RFP / tender involved: opportunity is created when Pre-Sales accepts the RFP synopsis. */
  @Column({ name: 'rfp_involved', type: 'boolean', default: false })
  rfpInvolved: boolean;

  /** Opportunity created when this lead was approved (public id, e.g. OPP-2026-00012). */
  @Column({ name: 'converted_opportunity_id', type: 'varchar', length: 32, nullable: true })
  convertedOpportunityId: string | null;
 
  // Stage timestamps
  @Column({ name: 'stage_1_entered', type: 'datetime', nullable: true })
  stage1Entered: Date;
 
  @Column({ name: 'stage_2_entered', type: 'datetime', nullable: true })
  stage2Entered: Date;
 
  @Column({ name: 'stage_3_entered', type: 'datetime', nullable: true })
  stage3Entered: Date;
 
  @Column({ name: 'stage_4_entered', type: 'datetime', nullable: true })
  stage4Entered: Date;
 
  @Column({ name: 'last_transfer_date', type: 'date', nullable: true })
  lastTransferDate: Date;
 
  // Relationships
  @OneToOne(
    () => LeadQualification,
    (qualification) => qualification.lead,
  )
  qualification: LeadQualification;
 
  @OneToMany(() => LeadHistory, (history) => history.lead)
  history: LeadHistory[];
 
  // System timestamps
  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
 
  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
 
  @DeleteDateColumn({ name: 'deleted_at', nullable: true })
  deletedAt: Date;
}
 