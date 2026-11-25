import { NestFactory } from '@nestjs/core';
import { loadEnvFiles } from './config/load-env';
import { AppModule } from './app.module';
import { configureApp } from './app.setup';

loadEnvFiles();

function listenPort(): number {
  const raw = process.env.OPPORTUNITY_SERVICE_PORT || process.env.PORT || '3005';
  const port = Number(raw);
  return Number.isFinite(port) && port > 0 ? port : 3005;
}

async function bootstrap() {
  const port = listenPort();
  const app = await NestFactory.create(AppModule);
  configureApp(app);
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