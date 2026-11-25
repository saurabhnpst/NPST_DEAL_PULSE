import { NestFactory } from '@nestjs/core';
import { loadEnvFiles } from './config/load-env';
import { AppModule } from './app.module';
import { configureApp, setupSwagger } from './app.setup';

loadEnvFiles();

/** ASSIGNMENT_SERVICE_PORT, default 3007 (the shared PORT is ignored so services don't clash). */
const port = Number(process.env.ASSIGNMENT_SERVICE_PORT) || 3007;

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  configureApp(app);
  setupSwagger(app);
  await app.listen(port);
  // eslint-disable-next-line no-console
  console.log(`assignment-service listening on http://localhost:${port}/api/v1/health (docs: /api/docs)`);
}

bootstrap().catch((err: NodeJS.ErrnoException) => {
  if (err?.code === 'EADDRINUSE') {
    // eslint-disable-next-line no-console
    console.error(`Port ${port} is already in use. Stop the other instance or set ASSIGNMENT_SERVICE_PORT.`);
    process.exit(1);
  }
  throw err;
});
