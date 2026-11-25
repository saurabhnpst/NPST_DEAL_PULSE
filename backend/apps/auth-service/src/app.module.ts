import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { resolve } from 'path';
import {
  CommandModuleAuthModule,
  SessionAuthGuard,
} from '../../../libs/command-module-auth/src';
import authConfig, { type AuthServiceConfig } from './config/auth.config';
import { HealthController } from './health.controller';
import { AuthModule } from './auth/auth.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: resolve(process.cwd(), 'apps/auth-service/.env'),
      load: [authConfig],
    }),
    CommandModuleAuthModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const auth = config.getOrThrow<AuthServiceConfig>('auth');
        return {
          redisUrl: auth.redisUrl,
          sessionCookieName: auth.sessionCookieName,
        };
      },
    }),
    AuthModule,
  ],
  controllers: [HealthController],
  providers: [{ provide: APP_GUARD, useClass: SessionAuthGuard }],
})
export class AppModule {}