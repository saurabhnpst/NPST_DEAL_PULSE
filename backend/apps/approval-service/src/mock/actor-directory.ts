import { MockActor } from './actor.types';

export const ACTOR_DIRECTORY = Symbol('APPROVAL_ACTOR_DIRECTORY');

export interface ActorDirectory {
  findActor(actorId: string): MockActor | undefined;
}
