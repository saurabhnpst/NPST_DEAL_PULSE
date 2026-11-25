import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { resolve } from 'path';

import { DealplusAuthModule } from '../../../libs/common/src/auth/dealplus-auth.module';
import commandModuleConfig from '../../../libs/common/src/config/command-module.config';
import { serviceEnvFile } from '../../../libs/common/src/config/service-env';
import { HealthController } from './health.controller';
import { HistoryModule } from './history/history.module';
import { LeadsModule } from './leads/leads.module';
import { QualificationsModule } from './qualifications/qualifications.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: serviceEnvFile('lead-service'),
      load: [commandModuleConfig],
    }),
    DealplusAuthModule.register(),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql' as const,
        host: config.getOrThrow<string>('DB_HOST'),
        port: Number(config.get('DB_PORT', 16659)),
        username: config.getOrThrow<string>('DB_USER'),
        password: config.getOrThrow<string>('DB_PASSWORD'),
        database: config.getOrThrow<string>('DB_NAME'),

        autoLoadEntities: true,
        synchronize: false,

        ssl: (() => {
          const sslCa = config.get<string>('DB_SSL_CA');
          if (!sslCa) {
            return undefined;
          }
          return {
            ca: readFileSync(resolve(process.cwd(), sslCa)),
            rejectUnauthorized: true,
          };
        })(),
      }),
    }),

    LeadsModule,
    QualificationsModule,
    HistoryModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}