import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import {
  assertRequiredEnv,
  loadServiceEnv,
} from '../../../libs/common/src/config/service-env';
import { AppModule } from './app.module';
import type { AuthServiceConfig } from './config/auth.config';

async function bootstrap() {
  loadServiceEnv('auth-service');
  assertRequiredEnv(['AUTH_LOCAL_USERS']);

  const app = await NestFactory.create(AppModule);
  const auth = app.get(ConfigService).getOrThrow<AuthServiceConfig>('auth');

  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.enableCors({
    origin: auth.corsOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: [
      'Content-Type',
      'Authorization',
      'X-CSRF-Token',
      'X-Requested-With',
    ],
  });

  const port = Number(process.env.PORT ?? 3001);
  await app.listen(port);
}
void bootstrap();