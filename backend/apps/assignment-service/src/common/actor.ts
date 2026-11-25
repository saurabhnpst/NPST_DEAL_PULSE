import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * Id of the user making the request, read from the `x-user-id` header.
 * The API gateway sets this header after it checks the login token.
 * Returns undefined when the header is missing or not a positive integer.
 */
export const ActorId = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): number | undefined => {
    const raw = ctx.switchToHttp().getRequest().headers['x-user-id'];
    const id = Number(Array.isArray(raw) ? raw[0] : raw);
    return Number.isInteger(id) && id > 0 ? id : undefined;
  },
);

/** The header wins. The body's `changedByUserId` is a fallback for callers not yet going through the gateway. */
export function pickActor(
  headerId: number | undefined,
  bodyId?: number | null,
): number | undefined {
  return headerId ?? bodyId ?? undefined;
}
