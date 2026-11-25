import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './config/database.config';
import { ASSIGNMENT_ENTITIES } from './entities';
import { HealthController } from './health.controller';
import { IntegrationsModule } from './integrations/integrations.module';
import { AssignmentEventPublisher } from './events/assignment-event.publisher';
import { HistoryService } from './history/history.service';
import { LookupService } from './common/lookup.service';
import { ProductVerticalsController } from './product-verticals/product-verticals.controller';
import { ProductVerticalsService } from './product-verticals/product-verticals.service';
import { AssignmentsController } from './assignments/assignments.controller';
import { RequirementsController } from './assignments/requirements.controller';
import { AssignmentsService } from './assignments/assignments.service';
import { HandoffsController } from './handoffs/handoffs.controller';
import { HandoffsService } from './handoffs/handoffs.service';

/** One module: the service is small enough that splitting it would only add files. */
@Module({
  imports: [
    TypeOrmModule.forRoot(buildDataSourceOptions(__dirname)),
    TypeOrmModule.forFeature(ASSIGNMENT_ENTITIES),
    IntegrationsModule,
  ],
  controllers: [
    HealthController,
    ProductVerticalsController,
    AssignmentsController,
    RequirementsController,
    HandoffsController,
  ],
  providers: [
    AssignmentEventPublisher,
    HistoryService,
    LookupService,
    ProductVerticalsService,
    AssignmentsService,
    HandoffsService,
  ],
})
export class AppModule {}
