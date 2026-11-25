import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceRequirement } from '../entities/compliance-requirement.entity';
import { FrameworksModule } from '../frameworks/frameworks.module';
import { RequirementsController } from './requirements.controller';
import { RequirementsService } from './requirements.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([ComplianceRequirement]),
    FrameworksModule,
  ],
  controllers: [RequirementsController],
  providers: [RequirementsService],
})
export class RequirementsModule {}