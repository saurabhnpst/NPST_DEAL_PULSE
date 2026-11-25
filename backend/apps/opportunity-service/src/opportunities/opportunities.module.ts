import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Opportunity } from '../entities/opportunity.entity';
import { OpportunityProduct } from '../entities/opportunity-product.entity';
import { OpportunityPublicIdSequence } from '../entities/opportunity-public-id-sequence.entity';
import { OpportunityStageHistory } from '../entities/opportunity-stage-history.entity';
import { OpportunityCommercialHistory } from '../entities/opportunity-commercial-history.entity';
import { OpportunityActivity } from '../entities/opportunity-activity.entity';
import { OpportunityDomainEvent } from '../entities/opportunity-domain-event.entity';
import { OpportunitiesController } from './opportunities.controller';
import { OpportunitiesService } from './opportunities.service';
import { OpportunityPublicIdService } from './opportunity-public-id.service';
import { OpportunityStagesController } from '../stages/opportunity-stages.controller';
import { StageTransitionService } from '../stages/stage-transition.service';
import { StageValidationService } from '../stages/stage-validation.service';
import { OpportunityProductsController } from '../products/opportunity-products.controller';
import { OpportunityProductsService } from '../products/opportunity-products.service';
import { OpportunityContributorsController } from '../contributors/opportunity-contributors.controller';
import { OpportunityContributorsService } from '../contributors/opportunity-contributors.service';
import { OpportunityRevenueController } from '../revenue/opportunity-revenue.controller';
import { OpportunityRevenueService } from '../revenue/opportunity-revenue.service';
import { OpportunityCommercialsController } from '../commercials/opportunity-commercials.controller';
import { OpportunityCommercialsService } from '../commercials/opportunity-commercials.service';
import { OpportunityActivitiesController } from '../activities/opportunity-activities.controller';
import { OpportunityActivitiesService } from '../activities/opportunity-activities.service';
import { OpportunityPoController } from '../po/opportunity-po.controller';
import { OpportunityPoService } from '../po/opportunity-po.service';
import { OpportunityHistoryController } from '../history/opportunity-history.controller';
import { OpportunityHistoryService } from '../history/opportunity-history.service';
import { OpportunityPipelineService } from '../pipeline/opportunity-pipeline.service';
import { OpportunityFallbackController } from '../fallback/opportunity-fallback.controller';
import { OpportunityFallbackService } from '../fallback/opportunity-fallback.service';
import { ExternalReferencesService } from '../integrations/external-references.service';
import { OpportunityEventPublisher } from '../events/opportunity-event.publisher';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Opportunity,
      OpportunityProduct,
      OpportunityPublicIdSequence,
      OpportunityStageHistory,
      OpportunityCommercialHistory,
      OpportunityActivity,
      OpportunityDomainEvent,
    ]),
  ],
  controllers: [
    OpportunitiesController,
    OpportunityStagesController,
    OpportunityProductsController,
    OpportunityContributorsController,
    OpportunityRevenueController,
    OpportunityCommercialsController,
    OpportunityActivitiesController,
    OpportunityPoController,
    OpportunityHistoryController,
    OpportunityFallbackController,
  ],
  providers: [
    OpportunitiesService,
    OpportunityPublicIdService,
    StageTransitionService,
    StageValidationService,
    OpportunityProductsService,
    OpportunityContributorsService,
    OpportunityRevenueService,
    OpportunityCommercialsService,
    OpportunityActivitiesService,
    OpportunityPoService,
    OpportunityHistoryService,
    OpportunityPipelineService,
    OpportunityFallbackService,
    ExternalReferencesService,
    OpportunityEventPublisher,
  ],
})
export class OpportunitiesModule {}