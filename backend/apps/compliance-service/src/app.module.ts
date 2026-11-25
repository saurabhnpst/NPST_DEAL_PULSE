import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { resolveSslCaPath, validateDatabaseEnv } from '../../../libs/service-config/src';

import { AssessmentsModule } from './assessments/assessments.module';
import { EvidenceModule } from './evidence/evidence.module';
import { ReviewsModule } from './reviews/reviews.module';
import { SignoffsModule } from './signoffs/signoffs.module';
import { GapAnalysisModule } from './gap-analysis/gap-analysis.module';
import { MatricesModule } from './matrices/matrices.module';
import { ConfigurationsModule } from './configurations/configurations.module';
import { FrameworksModule } from './frameworks/frameworks.module';
import { HealthController } from './health.controller';
import { RequirementsModule } from './requirements/requirements.module';
import {
  resolveComplianceBackendRoot,
  resolveComplianceEnvFile,
} from './config/env-file';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolveComplianceEnvFile(),
      validate: (config) =>
        validateDatabaseEnv(config, {
          expectedDbName: 'compliance_db',
          serviceLabel: 'Compliance Service',
        }),
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const backendRoot = resolveComplianceBackendRoot();
        const sslCaPath = resolveSslCaPath(
          backendRoot,
          config.getOrThrow<string>('DB_SSL_CA'),
        );

        return {
          type: 'mysql' as const,
          host: config.getOrThrow<string>('DB_HOST'),
          port: Number(config.getOrThrow<string>('DB_PORT')),
          username: config.getOrThrow<string>('DB_USER'),
          password: config.getOrThrow<string>('DB_PASSWORD'),
          database: config.getOrThrow<string>('DB_NAME'),

          autoLoadEntities: true,
          synchronize: false,

          ssl: {
            ca: readFileSync(sslCaPath),
            rejectUnauthorized: true,
          },
        };
      },
    }),

    FrameworksModule,
    RequirementsModule,
    ConfigurationsModule,
    AssessmentsModule,
    MatricesModule,
    GapAnalysisModule,
    EvidenceModule,
    ReviewsModule,
    SignoffsModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}