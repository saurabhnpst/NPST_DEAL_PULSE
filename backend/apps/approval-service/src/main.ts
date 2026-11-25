import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { DomainErrorFilter } from './shared/domain-error.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
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
bootstrap();
