import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ComplianceConfigurationFramework } from '../entities/compliance-configuration-framework.entity';
import { ComplianceConfigurationRequirement } from '../entities/compliance-configuration-requirement.entity';
import { ComplianceConfiguration } from '../entities/compliance-configuration.entity';
import { ComplianceFramework } from '../entities/compliance-framework.entity';
import { ComplianceRequirement } from '../entities/compliance-requirement.entity';
import { ConfigurationsController } from './configurations.controller';
import { ConfigurationsService } from './configurations.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ComplianceConfiguration,
      ComplianceConfigurationFramework,
      ComplianceConfigurationRequirement,
      ComplianceFramework,
      ComplianceRequirement,
    ]),
  ],
  controllers: [ConfigurationsController],
  providers: [ConfigurationsService],
  exports: [ConfigurationsService],
})
export class ConfigurationsModule {}