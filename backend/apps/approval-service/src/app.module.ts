import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DealplusAuthModule } from '../../../libs/common/src/auth/dealplus-auth.module';
import commandModuleConfig from '../../../libs/common/src/config/command-module.config';
import { serviceEnvFile } from '../../../libs/common/src/config/service-env';
import { buildDataSourceOptions } from './config/database.config';
import { HealthController } from './health.controller';
import { ApprovalsController } from './approvals/approvals.controller';
import { DecisionsController } from './decisions/decisions.controller';
import { ApprovalLifecycleService } from './approvals/approval-lifecycle.service';
import { APPROVAL_REPOSITORY } from './approvals/approval.repository';
import { APPROVAL_POLICY } from './shared/approval-policy';
import { APPROVAL_ENTITIES } from './database/entities';
import { TypeOrmApprovalRepository } from './database/typeorm-approval.repository';
import { ACTOR_DIRECTORY } from './mock/actor-directory';
import { ASSIGNMENT_REPOSITORY } from './mock/approver-assignment.repository';
import { MockActorGuard } from './mock/mock-actor.guard';
import { MockApprovalPolicy } from './mock/mock-approval-policy';
import { MockDirectory } from './mock/mock-directory';
import { MockTokenCodec } from './mock/mock-token.codec';
import { ApprovalEscalationScheduler } from './shared/approval-escalation.scheduler';
import { CLOCK, SystemClock } from './shared/clock';
import { ApprovalConfigService } from './shared/config';
import { APPROVAL_EVENTS, InMemoryApprovalEventPublisher } from './shared/event-publisher';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: serviceEnvFile('approval-service'),
      load: [commandModuleConfig],
    }),
    TypeOrmModule.forRoot(buildDataSourceOptions(__dirname)),
    TypeOrmModule.forFeature(APPROVAL_ENTITIES),
    DealplusAuthModule.register(),
  ],
  controllers: [HealthController, ApprovalsController, DecisionsController],
  providers: [
    ApprovalConfigService,
    { provide: CLOCK, useClass: SystemClock },
    { provide: APPROVAL_REPOSITORY, useClass: TypeOrmApprovalRepository },
    { provide: APPROVAL_EVENTS, useClass: InMemoryApprovalEventPublisher },
    { provide: ASSIGNMENT_REPOSITORY, useClass: MockDirectory },
    { provide: ACTOR_DIRECTORY, useExisting: ASSIGNMENT_REPOSITORY },
    { provide: APPROVAL_POLICY, useClass: MockApprovalPolicy },
    MockTokenCodec,
    MockActorGuard,
    ApprovalLifecycleService,
    ApprovalEscalationScheduler,
  ],
})
export class AppModule {}