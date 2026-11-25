import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import {
  assertRequiredEnv,
  loadServiceEnv,
} from '../../../libs/common/src/config/service-env';
import { AppModule } from './app.module';

async function bootstrap() {
  loadServiceEnv('approval-service');
  assertRequiredEnv(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']);
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.enableCors();
  await app.listen(process.env.PORT || 3006);
}
bootstrap();