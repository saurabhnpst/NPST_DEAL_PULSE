import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { opportunityTypeOrmRoot } from './config/typeorm.config';
import { OpportunitiesModule } from './opportunities/opportunities.module';

@Module({
  imports: [opportunityTypeOrmRoot, OpportunitiesModule],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}