import { randomUUID } from 'crypto';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

const logger = new Logger('GatewayHTTP');

export function gatewayRequestMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const incoming =
    (typeof req.headers['x-correlation-id'] === 'string' && req.headers['x-correlation-id']) ||
    (typeof req.headers['x-request-id'] === 'string' && req.headers['x-request-id']);
  const correlationId = incoming || randomUUID();
  req.headers['x-correlation-id'] = correlationId;
  res.setHeader('X-Correlation-Id', correlationId);

  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    logger.log(`${req.method} ${req.originalUrl} → ${res.statusCode} (${ms}ms) [${correlationId}]`);
  });
  next();
}