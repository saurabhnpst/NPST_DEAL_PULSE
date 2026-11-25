import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import {
  CommandModuleAuthModule,
  SessionAuthGuard,
  SessionReader,
} from '../../../command-module-auth/src';
import type { CommandModuleEnvConfig } from '../config/command-module.config';
import commandModuleConfig from '../config/command-module.config';

/** No-op guard when Command Module Redis is not configured (local UI-only mode). */
class PassthroughAuthGuard {
  canActivate(): boolean {
    return true;
  }
}

@Module({})
export class DealplusAuthModule {
  static register(): DynamicModule {
    return {
      module: DealplusAuthModule,
      imports: [
        ConfigModule.forFeature(commandModuleConfig),
        CommandModuleAuthModule.forRootAsync({
          imports: [ConfigModule],
          inject: [ConfigService],
          useFactory: (config: ConfigService) => {
            const cm = config.get<CommandModuleEnvConfig>('commandModule');
            return {
              redisUrl: cm?.redisUrl || 'redis://127.0.0.1:6379',
              sessionCookieName: cm?.sessionCookieName || 'session_id',
            };
          },
        }),
      ],
      providers: [
        {
          provide: APP_GUARD,
          useFactory: (
            config: ConfigService,
            guard: SessionAuthGuard,
          ): SessionAuthGuard | PassthroughAuthGuard => {
            const cm = config.get<CommandModuleEnvConfig>('commandModule');
            if (!cm?.enabled) {
              return new PassthroughAuthGuard();
            }
            return guard;
          },
          inject: [ConfigService, SessionAuthGuard],
        },
      ],
    };
  }
}