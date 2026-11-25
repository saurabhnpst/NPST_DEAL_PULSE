import { validationError } from './errors';
import { ACTOR_ROLES, ActorRole } from './roles';

export function requireRecord(value: unknown, field = 'body'): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw validationError(`${field} must be an object`);
  }
  return value as Record<string, unknown>;
}

export function requireNonEmptyString(value: unknown, field: string): string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw validationError(`${field} is required`);
  }
  return value.trim();
}

export function optionalNonEmptyString(value: unknown, field: string): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  return requireNonEmptyString(value, field);
}

export function requireActorRole(value: unknown, field = 'role'): ActorRole {
  if (typeof value !== 'string' || !ACTOR_ROLES.includes(value as ActorRole)) {
    throw validationError(`${field} is invalid`);
  }
  return value as ActorRole;
}
