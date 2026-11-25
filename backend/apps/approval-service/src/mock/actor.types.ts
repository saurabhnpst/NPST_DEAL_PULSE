import { ActorRole } from '../shared/roles';

export interface MockActorScope {
  teamId: string;
  territoryId: string;
  productVertical: string;
}

export interface MockActor {
  actorId: string;
  role: ActorRole;
  scopes?: readonly MockActorScope[];
  taskIds?: readonly string[];
  documentIds?: readonly string[];
}

export interface ActorContextRequest {
  headers: Record<string, string | string[] | undefined>;
  actor?: MockActor;
}

export interface SignedActorPayload {
  actorId: string;
  exp: number;
}
