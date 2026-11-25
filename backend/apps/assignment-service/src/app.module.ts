import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DealplusAuthModule } from '../../../libs/common/src/auth/dealplus-auth.module';
import commandModuleConfig from '../../../libs/common/src/config/command-module.config';
import { serviceEnvFile } from '../../../libs/common/src/config/service-env';
import { HealthController } from './health.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: serviceEnvFile('assignment-service'),
      load: [commandModuleConfig],
    }),
    DealplusAuthModule.register(),
  ],
  controllers: [HealthController],
})
export class AppModule {}