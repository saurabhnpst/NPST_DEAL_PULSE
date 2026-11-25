import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import {
  assertRequiredEnv,
  loadServiceEnv,
} from '../../../libs/common/src/config/service-env';
import { AppModule } from './app.module';
import { DomainErrorFilter } from './shared/domain-error.filter';

async function bootstrap() {
  loadServiceEnv('approval-service');
  assertRequiredEnv(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']);
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.setGlobalPrefix('api/v1');
  app.useGlobalFilters(new DomainErrorFilter());
  app.enableCors();

  const config = new DocumentBuilder()
    .setTitle('DealPlus Approval Service')
    .setDescription('Scope 1 approval and decision mock API')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-mock-token', in: 'header' }, 'mock-token')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(process.env['PORT'] ?? 3006);
}
void bootstrap();