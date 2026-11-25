import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import {
  assertRequiredEnv,
  loadServiceEnv,
} from '../../../libs/common/src/config/service-env';
import { AppModule } from './app.module';
async function bootstrap() {
 loadServiceEnv('document-service');
 assertRequiredEnv(['DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME']);
 const app = await NestFactory.create(AppModule);
 app.use(cookieParser());
 app.setGlobalPrefix('api/v1');
 app.useGlobalPipes(
   new ValidationPipe({
     whitelist: true,
     forbidNonWhitelisted: true,
     transform: true,
     transformOptions: { enableImplicitConversion: true },
   }),
 );
 app.enableCors();
 const config = new DocumentBuilder()
   .setTitle('DealPlus Document Service API')
   .setDescription('API documentation for DealPlus Document Service')
   .setVersion('1.0')
   .addBearerAuth()
   .build();
 const document = SwaggerModule.createDocument(app, config);
 SwaggerModule.setup('api/docs', app, document);
 const port = Number(process.env.PORT ?? 3005);
 await app.listen(port);
}
bootstrap();