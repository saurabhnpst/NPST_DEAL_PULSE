import { INestApplication, ValidationPipe } from '@nestjs/common';
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
