import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ApiExceptionFilter } from './common/http-exception.filter';
import { EmptyStringToNullPipe } from './common/empty-string-to-null.pipe';

/** Shared HTTP setup, used by main.ts and the HTTP tests so both behave the same. */
export function configureApp(app: INestApplication): void {
  app.setGlobalPrefix('api/v1');
  app.useGlobalPipes(
    new EmptyStringToNullPipe(),
    new ValidationPipe({
      whitelist: true, // unknown fields are dropped silently, not rejected
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: { enableImplicitConversion: false },
    }),
  );
  app.useGlobalFilters(new ApiExceptionFilter());
  app.enableCors();
}

/** Swagger UI at /api/docs (same path as the other DealPlus services). */
export function setupSwagger(app: INestApplication): void {
  const config = new DocumentBuilder()
    .setTitle('Assignment Service')
    .setDescription('Product → Tech Lead mapping, technical assignments and Sales → Pre-Sales handoffs')
    .setVersion('1.0')
    .addApiKey({ type: 'apiKey', name: 'x-user-id', in: 'header' }, 'x-user-id')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
}
