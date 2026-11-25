import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Opportunity } from '../entities/opportunity.entity';
import { OPEN_STAGES, stageMeta } from '../stages/stage-definitions';
import {
  category,
  dealValue,
  weightedAmount,
} from '../common/opportunity-calculations';

@Injectable()
export class OpportunityPipelineService {
  constructor(
    @InjectRepository(Opportunity)
    private readonly opportunityRepo: Repository<Opportunity>,
  ) {}

  async summary() {
    const rows = await this.opportunityRepo.find();

    const open = rows.filter((o) => OPEN_STAGES.includes(o.stage));
    const pipelineValue = open.reduce((s, o) => s + dealValue(o.arr, o.oneTime), 0);
    const weightedPipeline = open.reduce(
      (s, o) => s + weightedAmount(o.stage, o.arr, o.oneTime),
      0,
    );

    const byStage = OPEN_STAGES.map((stage) => {
      const cards = open.filter((o) => o.stage === stage);
      const meta = stageMeta(stage);
      const stageValue = cards.reduce((s, o) => s + dealValue(o.arr, o.oneTime), 0);
      return {
        stage,
        count: cards.length,
        probability: meta.prob,
        forecast: meta.forecast,
        pipelineValue: stageValue,
        opportunities: cards.map((o) => ({
          id: o.id,
          publicId: o.publicId,
          name: o.name,
          accountName: o.accountName,
          closeDate: o.closeDate,
          dealValue: dealValue(o.arr, o.oneTime),
          dealCategory: category(dealValue(o.arr, o.oneTime)),
          ownerUserId: o.ownerUserId,
        })),
      };
    });

    return {
      openCount: open.length,
      pipelineValue,
      weightedPipeline,
      byStage,
    };
  }
}