import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { loadEnvFiles } from './config/load-env';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

loadEnvFiles();

function listenPort(): number {
  const raw = process.env.OPPORTUNITY_SERVICE_PORT || process.env.PORT || '3003';
  const port = Number(raw);
  return Number.isFinite(port) && port > 0 ? port : 3003;
}

async function bootstrap() {
  const port = listenPort();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  const swagger = new DocumentBuilder()
    .setTitle('DealPlus Opportunity Service')
    .setDescription('Opportunities pipeline and stage workflows')
    .setVersion('1.0')
    .build();
  SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, swagger));
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`opportunity-service listening on http://localhost:${port}/api/v1/health`);
}

bootstrap().catch((err: NodeJS.ErrnoException) => {
  const port = listenPort();
  if (err?.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(
      `Port ${port} is already in use. Stop the other instance (e.g. fuser -k ${port}/tcp) or set OPPORTUNITY_SERVICE_PORT.`,
    );
    process.exit(1);
  }
  throw err;
});