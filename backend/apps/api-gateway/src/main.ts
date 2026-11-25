import { Logger } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { ExpressAdapter } from '@nestjs/platform-express';
import * as cookieParser from 'cookie-parser';
import * as express from 'express';
import {
  assertRequiredEnv,
  loadServiceEnv,
} from '../../../libs/common/src/config/service-env';
import { AppModule } from './app.module';
import { gatewayCorsMiddleware, gatewayCorsOptions } from './config/gateway-cors';
import type { GatewayConfig } from './config/gateway.config';
import gatewayConfig from './config/gateway.config';
import { gatewayRequestMiddleware } from './middleware/gateway-request.middleware';
import { attachGatewayProxy } from './proxy/gateway-proxy';
import { attachOpenApiHub } from './openapi/openapi-hub';

async function bootstrap() {
  loadServiceEnv('api-gateway');
  assertRequiredEnv([
    'LEAD_SERVICE_URL',
    'OPPORTUNITY_SERVICE_URL',
    'RFP_SERVICE_URL',
    'DOCUMENT_SERVICE_URL',
    'APPROVAL_SERVICE_URL',
    'ASSIGNMENT_SERVICE_URL',
    'COMPLIANCE_SERVICE_URL',
  ]);

  const expressServer = express();
  expressServer.disable('x-powered-by');
  expressServer.use(gatewayRequestMiddleware);

  const bootstrapLogger = new Logger('GatewayBootstrap');
  const interimConfig = gatewayConfig() as GatewayConfig;
  expressServer.use(gatewayCorsMiddleware(interimConfig));
  attachOpenApiHub(expressServer as import('express').Application, interimConfig, bootstrapLogger);
  attachGatewayProxy(expressServer, interimConfig, bootstrapLogger);

  const app = await NestFactory.create(AppModule, new ExpressAdapter(expressServer));
  const config = app.get(ConfigService).getOrThrow<GatewayConfig>('gateway');

  app.use(cookieParser());
  app.enableCors(gatewayCorsOptions(config));

  const port = Number(process.env.PORT ?? 3010);
  await app.listen(port);
  bootstrapLogger.log(`API Gateway listening on http://localhost:${port}`);
}
void bootstrap();