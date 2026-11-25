import { BadRequestException, Injectable } from '@nestjs/common';
import { Opportunity, StageTaskJson } from '../entities/opportunity.entity';
import {
  EARLY_STAGES,
  HOLD_REASONS,
  LOST_REASONS,
  OPEN_STAGES,
  OVERRIDE_REASONS,
  isCloseableStage,
  isOpenStage,
  nextOpenStage,
  openStageIndex,
} from './stage-definitions';
import { missingRequiredFields } from './stage-field-rules';
import { StageView, toStageView } from './stage-view';
import { OpportunityProduct } from '../entities/opportunity-product.entity';

export type ValidationIssue = { code: string; message: string; details?: string[] };

@Injectable()
export class StageValidationService {
  openTasks(opp: Opportunity): StageTaskJson[] {
    const stage = opp.stage;
    return (opp.stageTasks ?? []).filter(
      (t) => (t.stage || stage) === stage && !t.done,
    );
  }

  needsEarlyCloseOverride(opp: Opportunity): boolean {
    return (opp.stageTasks ?? []).some(
      (t) => EARLY_STAGES.includes(t.stage || opp.stage) && !t.done,
    );
  }

  assertCanProceed(opp: Opportunity, products: OpportunityProduct[]): void {
    if (!isOpenStage(opp.stage)) {
      throw new BadRequestException('Only open stages can proceed');
    }
    if (!nextOpenStage(opp.stage)) {
      throw new BadRequestException(
        'Negotiation is the last open stage; use close endpoints for outcomes',
      );
    }
    const idx = openStageIndex(opp.stage);
    const view = toStageView(opp, products);
    const missing = missingRequiredFields(idx, view);
    const tasks = this.openTasks(opp);
    if (missing.length) {
      throw new BadRequestException({
        message: 'Fill these first',
        details: missing,
      });
    }
    if (tasks.length) {
      throw new BadRequestException({
        message: 'Complete these tasks first',
        details: tasks.map((t) => t.t),
      });
    }
  }

  validateComplete(opp: Opportunity, products: OpportunityProduct[]): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    if (!isOpenStage(opp.stage)) {
      issues.push({ code: 'NOT_OPEN', message: 'Stage is not an open stage' });
      return issues;
    }
    const idx = openStageIndex(opp.stage);
    const view = toStageView(opp, products);
    const missing = missingRequiredFields(idx, view);
    if (missing.length) {
      issues.push({ code: 'MISSING_FIELDS', message: 'Required fields missing', details: missing });
    }
    const tasks = this.openTasks(opp);
    if (tasks.length) {
      issues.push({
        code: 'OPEN_TASKS',
        message: 'Open stage tasks remain',
        details: tasks.map((t) => t.t),
      });
    }
    return issues;
  }

  assertCanHold(opp: Opportunity): void {
    if (opp.stage === 'On Hold') {
      throw new BadRequestException('Opportunity is already on hold');
    }
    if (!isCloseableStage(opp.stage) || !OPEN_STAGES.includes(opp.stage)) {
      throw new BadRequestException('Put on hold is only allowed from open stages');
    }
  }

  validateHoldPayload(payload: {
    holdReason: string;
    holdDetails: string;
    holdUntil?: string | null;
  }): void {
    if (!HOLD_REASONS.includes(payload.holdReason)) {
      throw new BadRequestException(`holdReason must be one of: ${HOLD_REASONS.join(', ')}`);
    }
    if (!payload.holdDetails?.trim()) {
      throw new BadRequestException('holdDetails is required');
    }
  }

  assertCanClose(opp: Opportunity, outcome: 'Closed Won' | 'Closed Lost' | 'No Bid'): void {
    if (!isCloseableStage(opp.stage)) {
      throw new BadRequestException('This stage cannot be closed');
    }
    if (opp.stage === outcome) {
      throw new BadRequestException(`Opportunity is already ${outcome}`);
    }
  }

  validateCloseWon(
    opp: Opportunity,
    payload: {
      poDate: string;
      poValue: number;
      projectStartActual?: string | null;
      firstBillingDate?: string | null;
      firstBillingValue?: number | null;
      overrideReason?: string | null;
      overrideJustification?: string | null;
    },
  ): void {
    if (!payload.poDate) throw new BadRequestException('poDate is required');
    if (!(Number(payload.poValue) > 0)) {
      throw new BadRequestException('poValue must be greater than 0');
    }
    if (this.needsEarlyCloseOverride(opp)) {
      if (!payload.overrideReason || !OVERRIDE_REASONS.includes(payload.overrideReason)) {
        throw new BadRequestException(
          `Early-close override requires overrideReason (${OVERRIDE_REASONS.join(', ')})`,
        );
      }
      if (!payload.overrideJustification?.trim()) {
        throw new BadRequestException('overrideJustification is required for early close');
      }
    }
  }

  validateCloseLost(
    opp: Opportunity,
    payload: {
      lostReason: string;
      lostReasonRemark?: string | null;
      overrideReason?: string | null;
      overrideJustification?: string | null;
    },
  ): void {
    if (!LOST_REASONS.includes(payload.lostReason)) {
      throw new BadRequestException(`lostReason must be one of: ${LOST_REASONS.join(', ')}`);
    }
    if (this.needsEarlyCloseOverride(opp)) {
      if (!payload.overrideReason || !OVERRIDE_REASONS.includes(payload.overrideReason)) {
        throw new BadRequestException(
          `Early-close override requires overrideReason (${OVERRIDE_REASONS.join(', ')})`,
        );
      }
      if (!payload.overrideJustification?.trim()) {
        throw new BadRequestException('overrideJustification is required for early close');
      }
    }
  }

  validateCloseNoBid(
    opp: Opportunity,
    payload: { overrideReason?: string | null; overrideJustification?: string | null },
  ): void {
    if (this.needsEarlyCloseOverride(opp)) {
      if (!payload.overrideReason || !OVERRIDE_REASONS.includes(payload.overrideReason)) {
        throw new BadRequestException(
          `Early-close override requires overrideReason (${OVERRIDE_REASONS.join(', ')})`,
        );
      }
      if (!payload.overrideJustification?.trim()) {
        throw new BadRequestException('overrideJustification is required for early close');
      }
    }
  }

  assertCanReopen(opp: Opportunity, targetStage: string): void {
    if (opp.stage !== 'On Hold') {
      throw new BadRequestException('Only opportunities on hold can be reopened');
    }
    if (!OPEN_STAGES.includes(targetStage)) {
      throw new BadRequestException(`Reopen target must be an open stage (${OPEN_STAGES.join(', ')})`);
    }
  }

  validateReopenFallback(payload: { plan: string; comment: string }): void {
    if (!payload.plan?.trim() || !payload.comment?.trim()) {
      throw new BadRequestException('plan and comment are required to reopen');
    }
  }
}