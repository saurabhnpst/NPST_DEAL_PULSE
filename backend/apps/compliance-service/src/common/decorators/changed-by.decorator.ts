import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { ACTOR_HEADER } from '../constants/compliance.constants';

/**
 * Reads the acting user id from the shared gateway convention header (no auth guard).
 */
export const ChangedBy = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const request = ctx.switchToHttp().getRequest<{ headers: Record<string, string> }>();
    const raw =
      request.headers[ACTOR_HEADER] ??
      request.headers[ACTOR_HEADER.toUpperCase()];
    return raw?.trim() || undefined;
  },
);