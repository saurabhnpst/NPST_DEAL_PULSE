import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  assertRequiredEnv,
  loadServiceEnv,
} from '../../../libs/common/src/config/service-env';
import { AppModule } from './app.module';

async function bootstrap() {
  loadServiceEnv('rfp-service');
  assertRequiredEnv(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']);
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );
  app.setGlobalPrefix('api/v1', { exclude: ['api/docs'] });
  app.enableCors();

  const swaggerConfig = new DocumentBuilder()
    .setTitle('DealPlus RFP Service API')
    .setDescription(
      'RFP record management, Document Service integration (Phase 2), and PDF ' +
        'text extraction / OCR (Phase 3), and information extraction / review (Phase 4). Database: rfp_db.',
    )
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('Health', 'Liveness and readiness probes')
    .addTag('RFPs', 'RFP CRUD, queries, and document download')
    .addTag('RFP PDF processing', 'PDF text extraction and OCR')
    .addTag('RFP information extraction', 'Field extraction, review and amendments')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  const port = process.env.PORT || 3004;
  await app.listen(port);
}
void bootstrap();