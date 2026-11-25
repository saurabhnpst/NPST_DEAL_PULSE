import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import {
  assertRequiredEnv,
  loadServiceEnv,
} from '../../../libs/common/src/config/service-env';
import { AppModule } from './app.module';
import type { GatewayConfig } from './config/gateway.config';
import { setupGatewayProxy } from './proxy/gateway-proxy';

async function bootstrap() {
  loadServiceEnv('api-gateway');
  assertRequiredEnv(['IAM_API_URL', 'LEAD_SERVICE_URL', 'DOCUMENT_SERVICE_URL', 'RFP_SERVICE_URL']);
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService).getOrThrow<GatewayConfig>('gateway');

  app.setGlobalPrefix('api/v1', {
    exclude: ['health', 'api/auth/(.*)', 'api/me', 'api/me/(.*)', 'api/public/(.*)'],
  });

  app.use(cookieParser());
  app.enableCors({
    origin: config.corsOrigins,
    credentials: config.corsCredentials,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-CSRF-Token', 'X-Requested-With'],
  });

  setupGatewayProxy(app);

  const port = Number(process.env.PORT ?? 3000);
  await app.listen(port);
}
bootstrap();