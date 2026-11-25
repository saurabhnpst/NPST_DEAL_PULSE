import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { forbiddenError } from '../shared/errors';
import { ActorContextRequest, MockActor } from './actor.types';

export const Actor = createParamDecorator(
  (_data: unknown, context: ExecutionContext): MockActor => {
    const request = context.switchToHttp().getRequest<ActorContextRequest>();
    if (request.actor === undefined) {
      throw forbiddenError('Actor context missing');
    }
    return request.actor;
  },
);
