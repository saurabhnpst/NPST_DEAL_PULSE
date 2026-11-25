export type ApprovalErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'FORBIDDEN'
  | 'CONFLICT'
  | 'MAPPING_MISSING'
  | 'SELF_APPROVAL'
  | 'NOT_IMPLEMENTED'
  | 'CONFIGURATION_ERROR';

export class DomainError extends Error {
  constructor(
    public readonly code: ApprovalErrorCode,
    message: string,
    public readonly httpStatus: number,
  ) {
    super(message);
    this.name = code;
    Object.setPrototypeOf(this, DomainError.prototype);
  }
}

export function validationError(message: string): DomainError {
  return new DomainError('VALIDATION_ERROR', message, 400);
}

export function notFoundError(message: string): DomainError {
  return new DomainError('NOT_FOUND', message, 404);
}

export function forbiddenError(message: string): DomainError {
  return new DomainError('FORBIDDEN', message, 403);
}

export function conflictError(message: string, code: ApprovalErrorCode = 'CONFLICT'): DomainError {
  return new DomainError(code, message, 409);
}

export function mappingMissingError(message: string): DomainError {
  return new DomainError('MAPPING_MISSING', message, 422);
}

export function notImplementedError(message: string): DomainError {
  return new DomainError('NOT_IMPLEMENTED', message, 501);
}

export function configurationError(message: string): DomainError {
  return new DomainError('CONFIGURATION_ERROR', message, 500);
}
