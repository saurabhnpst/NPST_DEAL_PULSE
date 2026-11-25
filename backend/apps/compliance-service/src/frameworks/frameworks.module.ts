import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceFramework } from '../entities/compliance-framework.entity';
import { FrameworksController } from './frameworks.controller';
import { FrameworksService } from './frameworks.service';

@Module({
  imports: [TypeOrmModule.forFeature([ComplianceFramework])],
  controllers: [FrameworksController],
  providers: [FrameworksService],
  exports: [FrameworksService],
})
export class FrameworksModule {}