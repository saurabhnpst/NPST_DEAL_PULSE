import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import documentServiceConfig from './config/document-service.config';
import informationExtractionConfig from './config/information-extraction.config';
import pdfProcessingConfig from './config/pdf-processing.config';
import redisConfig, { RedisConfig } from './config/redis.config';
import { DealplusAuthModule } from '../../../libs/common/src/auth/dealplus-auth.module';
import commandModuleConfig from '../../../libs/common/src/config/command-module.config';
import { serviceEnvFile } from '../../../libs/common/src/config/service-env';
import { HealthController } from './health.controller';
import { RfpsModule } from './rfps/rfps.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: serviceEnvFile('rfp-service'),
      load: [
        documentServiceConfig,
        pdfProcessingConfig,
        informationExtractionConfig,
        redisConfig,
        commandModuleConfig,
      ],
    }),
    DealplusAuthModule.register(),
    BullModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const redis = config.getOrThrow<RedisConfig>('redis');
        return {
          connection: {
            host: redis.host,
            port: redis.port,
            password: redis.password,
            ...(redis.tls ? { tls: { rejectUnauthorized: true } } : {}),
          },
        };
      },
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'mysql',
        host: config.getOrThrow('DB_HOST'),
        port: Number(config.get('DB_PORT', 16659)),
        username: config.getOrThrow('DB_USER'),
        password: config.getOrThrow('DB_PASSWORD'),
        database: config.getOrThrow('DB_NAME'),
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
    RfpsModule,
  ],
  controllers: [HealthController],
  providers: [],
})
export class AppModule {}