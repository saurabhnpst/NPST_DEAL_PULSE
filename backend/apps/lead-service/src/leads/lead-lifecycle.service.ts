import {
  BadRequestException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Lead } from '../entities/lead.entity';
import {
  LeadApprovalStage,
  LeadLifecycleStage,
} from '../common/constants/lead-lifecycle.constants';
import { ApprovalIntegration } from '../integrations/approval.integration';
import { OpportunityIntegration } from '../integrations/opportunity.integration';

@Injectable()
export class LeadLifecycleService {
  private readonly logger = new Logger(LeadLifecycleService.name);

  constructor(
    private readonly approvalIntegration: ApprovalIntegration,
    private readonly opportunityIntegration: OpportunityIntegration,
  ) {}

  ensureDefaultStage(lead: Lead): void {
    if (!lead.status) {
      lead.status = LeadLifecycleStage.NEW;
    }
    if (!lead.stage1Entered && lead.status === LeadLifecycleStage.NEW) {
      lead.stage1Entered = new Date();
    }
  }

  /**
   * Stage 2 – Working. Callable when moving from New or resuming work.
   */
  moveToWorking(lead: Lead): void {
    lead.status = LeadLifecycleStage.WORKING;
    if (!lead.stage2Entered) {
      lead.stage2Entered = new Date();
    }
  }

  /**
   * After need assessment on Working lead.
   * Yes -> submit for approval (Stage stays Working until approved).
   * No -> Unqualified or Nurturing.
   */
  async assessNeed(
    lead: Lead,
    hasNeed: boolean,
    options: { reconnectInMonths?: 3 | 6 },
    changedBy?: string,
  ): Promise<void> {
    if (lead.status !== LeadLifecycleStage.WORKING) {
      throw new BadRequestException(
        'Need assessment is only allowed in Working stage',
      );
    }

    if (hasNeed) {
      lead.approvalStage = LeadApprovalStage.PENDING;
      await this.approvalIntegration.submitLeadForApproval({
        leadId: lead.id,
        requestedBy: changedBy,
      });
      return;
    }

    if (options.reconnectInMonths === 3 || options.reconnectInMonths === 6) {
      lead.status = LeadLifecycleStage.NURTURING;
      if (!lead.stage4Entered) {
        lead.stage4Entered = new Date();
      }
    } else {
      lead.status = LeadLifecycleStage.UNQUALIFIED;
      if (!lead.stage3Entered) {
        lead.stage3Entered = new Date();
      }
    }
  }

  /**
   * Approval rejected (approval-service decision) — lead closes as Unqualified with the reason.
   */
  markRejectedAfterApproval(lead: Lead, reason: string): void {
    if (lead.approvalStage !== LeadApprovalStage.PENDING) {
      throw new BadRequestException('Lead is not pending approval');
    }
    lead.approvalStage = LeadApprovalStage.REJECTED;
    lead.status = LeadLifecycleStage.UNQUALIFIED;
    lead.disqualificationReason = 'Rejected in approval';
    lead.disqualificationRemark = reason.slice(0, 255);
    if (!lead.stage3Entered) {
      lead.stage3Entered = new Date();
    }
  }

  /**
   * Approver asked for more work — lead goes back to Sales (Working, no pending approval).
   */
  markSentBackAfterApproval(lead: Lead): void {
    if (lead.approvalStage !== LeadApprovalStage.PENDING) {
      throw new BadRequestException('Lead is not pending approval');
    }
    lead.approvalStage = LeadApprovalStage.NONE;
    lead.status = LeadLifecycleStage.WORKING;
  }

  /**
   * After external approval succeeds — Stage 5 Qualified + opportunity handoff.
   * Formula fields (tspProductFormula, evokProductFormula) are entity columns only;
   * computation depends on upstream product rules not available in this repo.
   */
  async markQualifiedAfterApproval(
    lead: Lead,
    changedBy?: string,
  ): Promise<void> {
    if (lead.approvalStage !== LeadApprovalStage.PENDING) {
      throw new BadRequestException(
        'Lead is not pending approval',
      );
    }
    const prior = {
      approvalStage: lead.approvalStage,
      approved: lead.approved,
      status: lead.status,
      converting: lead.converting,
    };
    lead.approvalStage = LeadApprovalStage.APPROVED;
    lead.approved = true;
    lead.status = LeadLifecycleStage.QUALIFIED;
    if (lead.rfpInvolved) {
      // RFP lead: stays Qualified until Pre-Sales accepts the RFP synopsis (that creates the opportunity).
      lead.converting = false;
      return;
    }
    lead.converting = true;
    try {
      const { opportunityId } = await this.opportunityIntegration.convertLeadToOpportunity(
        lead,
        { leadId: lead.id, convertedBy: changedBy },
      );
      lead.converting = false;
      lead.convertedOpportunityId = opportunityId;
      this.logger.log(`Lead ${lead.id} converted to opportunity ${opportunityId}`);
    } catch (err) {
      lead.approvalStage = prior.approvalStage;
      lead.approved = prior.approved;
      lead.status = prior.status;
      lead.converting = false;
      throw err;
    }
  }
}