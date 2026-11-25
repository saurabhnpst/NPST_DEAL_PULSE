import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { HoldFallbackJson, Opportunity } from '../entities/opportunity.entity';
import { OpportunityStageHistory } from '../entities/opportunity-stage-history.entity';
import { OpportunitiesService } from '../opportunities/opportunities.service';
import { OpportunityResponse } from '../opportunities/opportunity.mapper';
import { StageValidationService } from './stage-validation.service';
import { OPEN_STAGES, isOpenStage, nextOpenStage, stageMeta } from './stage-definitions';
import { OpportunityEventPublisher } from '../events/opportunity-event.publisher';
import { OPPORTUNITY_EVENT_TYPES } from '../events/domain-event';

/** Extra columns saved on the stage history row. */
type HistoryDetails = Partial<
  Pick<
    OpportunityStageHistory,
    | 'lostReason' | 'lostReasonRemark'
    | 'holdReason' | 'holdDetails' | 'holdUntil' | 'holdFromStage'
    | 'earlyClose' | 'overrideReason' | 'overrideJustification'
    | 'poDate' | 'poValue' | 'closedValue'
    | 'projectStartActual' | 'firstBillingDate' | 'firstBillingValue'
  >
>;

/** What a stage action does, worked out from the locked opportunity row. */
type StageMove = {
  toStage: string;
  /** Extra changes to the opportunity (runs before `stage` is updated). */
  update?: (opp: Opportunity) => void;
  details?: HistoryDetails;
  /** Appended to the history text "Stage: A → B". */
  note?: string;
};

type OverrideInput = { overrideReason?: string | null; overrideJustification?: string | null };

const money = (n: number) => n.toFixed(2);
const day = (d?: string | null) => (d ? d.slice(0, 10) : null);

@Injectable()
export class StageTransitionService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly opportunities: OpportunitiesService,
    private readonly validation: StageValidationService,
    private readonly events: OpportunityEventPublisher,
  ) {}

  async getStageContext(id: string) {
    const opp = await this.opportunities.findEntity(id);
    const meta = stageMeta(opp.stage);
    return {
      stage: opp.stage,
      _prob: meta.prob,
      _forecast: meta.forecast,
      open: meta.open,
      nextOpenStage: nextOpenStage(opp.stage),
      canProceed: isOpenStage(opp.stage) && !!nextOpenStage(opp.stage),
    };
  }

  /** Dry run: reports what still blocks "proceed" without moving the stage. */
  async completeStage(id: string, stageId: string) {
    const opp = await this.opportunities.findEntity(id);
    this.assertStageId(opp.stage, stageId);
    const issues = this.validation.validateComplete(opp, opp.products ?? []);
    return { ready: issues.length === 0, issues };
  }

  proceed(id: string, stageId: string, changedByUserId?: number) {
    return this.move(id, changedByUserId, (opp) => {
      this.assertStageId(opp.stage, stageId);
      this.validation.assertCanProceed(opp, opp.products ?? []);
      return { toStage: nextOpenStage(opp.stage) as string };
    });
  }

  hold(
    id: string,
    body: { holdReason: string; holdDetails: string; holdUntil?: string | null; changedByUserId?: number },
  ) {
    return this.move(id, body.changedByUserId, (opp) => {
      this.validation.assertCanHold(opp);
      this.validation.validateHoldPayload(body);
      const holdDetails = body.holdDetails.trim();
      const holdUntil = day(body.holdUntil);
      const holdFromStage = opp.stage;
      return {
        toStage: 'On Hold',
        update: (o) => {
          o.holdReason = body.holdReason;
          o.holdDetails = holdDetails;
          o.holdUntil = holdUntil;
          o.holdFromStage = holdFromStage;
          o.holdAt = new Date();
        },
        details: { holdReason: body.holdReason, holdDetails, holdUntil, holdFromStage },
        note: ` · hold reason: ${body.holdReason} — ${holdDetails}`,
      };
    });
  }

  closeWon(
    id: string,
    body: OverrideInput & {
      poDate: string;
      poValue: number;
      projectStartActual?: string | null;
      firstBillingDate?: string | null;
      firstBillingValue?: number | null;
      changedByUserId?: number;
    },
  ) {
    return this.move(id, body.changedByUserId, (opp) => {
      this.validation.assertCanClose(opp, 'Closed Won');
      this.validation.validateCloseWon(opp, body);
      const override = this.earlyCloseOverride(opp, body);
      const poDate = day(body.poDate) as string;
      const poValue = money(body.poValue);
      const won = {
        projectStartActual: day(body.projectStartActual),
        firstBillingDate: day(body.firstBillingDate),
        firstBillingValue: body.firstBillingValue != null ? money(body.firstBillingValue) : null,
      };
      const symbol = opp.currency === 'USD' ? '$' : '₹';
      return {
        toStage: 'Closed Won',
        update: (o) => {
          o.poDate = poDate;
          o.poValue = poValue;
          o.closedValue = poValue;
          o.poReceived = 'Yes';
          o.closeDate = poDate;
          // Optional values only overwrite when given.
          if (won.projectStartActual) o.projectStartActual = won.projectStartActual;
          if (won.firstBillingDate) o.firstBillingDate = won.firstBillingDate;
          if (won.firstBillingValue) o.firstBillingValue = won.firstBillingValue;
          Object.assign(o, override);
        },
        details: { poDate, poValue, closedValue: poValue, ...won, ...override },
        note: ` · PO ${symbol}${body.poValue} dated ${poDate}${this.overrideNote(override)}`,
      };
    });
  }

  closeLost(
    id: string,
    body: OverrideInput & { lostReason: string; lostReasonRemark?: string | null; changedByUserId?: number },
  ) {
    return this.move(id, body.changedByUserId, (opp) => {
      this.validation.assertCanClose(opp, 'Closed Lost');
      this.validation.validateCloseLost(opp, body);
      const override = this.earlyCloseOverride(opp, body);
      const lostReasonRemark = body.lostReasonRemark?.trim() || null;
      return {
        toStage: 'Closed Lost',
        update: (o) => {
          o.lostReason = body.lostReason;
          o.lostReasonRemark = lostReasonRemark;
          Object.assign(o, override);
        },
        details: { lostReason: body.lostReason, lostReasonRemark, ...override },
        note:
          ` (${body.lostReason}${lostReasonRemark ? ` — ${lostReasonRemark}` : ''})`
          + this.overrideNote(override),
      };
    });
  }

  closeNoBid(id: string, body: OverrideInput & { changedByUserId?: number }) {
    return this.move(id, body.changedByUserId, (opp) => {
      this.validation.assertCanClose(opp, 'No Bid');
      this.validation.validateCloseNoBid(opp, body);
      const override = this.earlyCloseOverride(opp, body);
      return {
        toStage: 'No Bid',
        update: (o) => Object.assign(o, override),
        details: override,
        note: this.overrideNote(override),
      };
    });
  }

  reopen(
    id: string,
    body: { stage: string; plan: string; comment: string; suggestion?: string | null; changedByUserId?: number },
  ) {
    return this.move(id, body.changedByUserId, (opp) => {
      this.validation.assertCanReopen(opp, body.stage);
      this.validation.validateReopenFallback(body);
      const entry: HoldFallbackJson = {
        kind: 'Reopened',
        by: body.changedByUserId ? String(body.changedByUserId) : 'system',
        at: new Date().toISOString(),
        plan: body.plan.trim(),
        suggestion: body.suggestion?.trim() ?? '',
        comment: body.comment.trim(),
        stage: body.stage,
      };
      return {
        toStage: body.stage,
        update: (o) => {
          o.holdUntil = null;
          o.reopenedAt = new Date();
          o.holdFallbacks = [entry, ...(o.holdFallbacks ?? [])];
        },
        note: ` · reopened with fallback: ${entry.plan}`,
      };
    });
  }

  /**
   * Runs one stage action in a transaction:
   * lock the row → check the rules on that locked row → update → write history + outbox event.
   * Checking on the locked row means two requests at the same moment cannot both pass.
   */
  private async move(
    id: string,
    actorId: number | undefined,
    plan: (opp: Opportunity) => StageMove,
  ): Promise<OpportunityResponse> {
    const { id: pk } = await this.opportunities.findEntity(id);

    await this.dataSource.transaction(async (manager) => {
      const opp = await manager.getRepository(Opportunity).findOne({
        where: { id: pk },
        relations: { products: true },
        lock: { mode: 'pessimistic_write' },
      });
      if (!opp) throw new NotFoundException('Opportunity not found');

      const step = plan(opp);
      const fromStage = opp.stage;
      if (step.toStage === fromStage) {
        throw new BadRequestException(`Opportunity is already ${fromStage}`);
      }

      step.update?.(opp);
      opp.stage = step.toStage;
      if (actorId != null) opp.lastModifiedByUserId = String(actorId);
      await manager.save(opp);

      await manager.save(
        manager.create(OpportunityStageHistory, {
          ...step.details,
          opportunityId: pk,
          fromStage,
          toStage: step.toStage,
          changedByUserId: actorId != null ? String(actorId) : null,
          changedAt: new Date(),
          narrative: `Stage: ${fromStage} → ${step.toStage}${step.note ?? ''}`,
        }),
      );
      await this.events.publishInTransaction(
        manager,
        OPPORTUNITY_EVENT_TYPES.STAGE_CHANGED,
        pk,
        { publicId: opp.publicId, fromStage, toStage: step.toStage },
      );
    });

    return this.opportunities.findOne(pk);
  }

  /** Override fields to store when closing while early-stage tasks are still open. */
  private earlyCloseOverride(opp: Opportunity, body: OverrideInput) {
    if (!this.validation.needsEarlyCloseOverride(opp)) return {};
    return {
      earlyClose: true,
      overrideReason: body.overrideReason ?? null,
      overrideJustification: body.overrideJustification?.trim() || null,
    };
  }

  private overrideNote(override: { overrideReason?: string | null }) {
    return override.overrideReason ? ` · override: ${override.overrideReason}` : '';
  }

  private assertStageId(currentStage: string, stageId: string): void {
    if (this.normalizeStageId(stageId) !== currentStage) {
      throw new BadRequestException(`stageId must match the current stage (${currentStage})`);
    }
  }

  /** Accepts the stage name, a slug ("needs-analysis") or the open-stage index 0–4. */
  private normalizeStageId(stageId: string): string {
    const trimmed = decodeURIComponent(stageId).trim();
    if (/^[0-4]$/.test(trimmed)) return OPEN_STAGES[Number(trimmed)];
    const slug = trimmed.toLowerCase().replace(/[\s-]+/g, ' ');
    return OPEN_STAGES.find((s) => s.toLowerCase() === slug) ?? trimmed;
  }
}
