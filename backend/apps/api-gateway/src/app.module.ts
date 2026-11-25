import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { resolve } from 'path';
import gatewayConfig from './config/gateway.config';
import { HealthController } from './health.controller';
import { serviceEnvFile } from '../../../libs/common/src/config/service-env';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: serviceEnvFile('api-gateway'),
      load: [gatewayConfig],
    }),
  ],
  controllers: [HealthController],
})
export class AppModule {}