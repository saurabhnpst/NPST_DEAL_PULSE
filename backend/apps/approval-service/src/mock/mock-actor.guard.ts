import { CanActivate, ExecutionContext, Inject, Injectable } from '@nestjs/common';
import { forbiddenError } from '../shared/errors';
import { ACTOR_DIRECTORY, ActorDirectory } from './actor-directory';
import { ActorContextRequest } from './actor.types';
import { MockTokenCodec } from './mock-token.codec';

@Injectable()
export class MockActorGuard implements CanActivate {
  constructor(
    private readonly tokens: MockTokenCodec,
    @Inject(ACTOR_DIRECTORY) private readonly directory: ActorDirectory,
  ) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<ActorContextRequest>();
    const actor = this.directory.findActor(this.actorId(request.headers));
    if (actor === undefined) {
      throw forbiddenError('Unknown actor');
    }
    request.actor = actor;
    return true;
  }

  /**
   * Local development: the portal sends the signed-in user's approval actor as `x-actor-id`
   * (from auth-service). Outside development a signed mock token is still required.
   */
  private actorId(headers: Record<string, string | string[] | undefined>): string {
    const devActor = this.header(headers, 'x-actor-id');
    if (process.env.NODE_ENV !== 'production' && devActor !== undefined && devActor.length > 0) {
      return devActor;
    }
    return this.tokens.verify(this.extractToken(headers)).actorId;
  }

  private extractToken(headers: Record<string, string | string[] | undefined>): string {
    const authorization = this.header(headers, 'authorization');
    if (authorization?.startsWith('Bearer ') === true) {
      return authorization.slice(7).trim();
    }
    const token = this.header(headers, 'x-mock-token');
    if (token !== undefined && token.length > 0) {
      return token;
    }
    throw forbiddenError('Mock token required');
  }

  private header(
    headers: Record<string, string | string[] | undefined>,
    name: string,
  ): string | undefined {
    const value = headers[name];
    return Array.isArray(value) ? value[0] : value;
  }
}
