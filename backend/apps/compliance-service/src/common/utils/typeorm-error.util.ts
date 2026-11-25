import { ConflictException } from '@nestjs/common';
import { QueryFailedError } from 'typeorm';

/** Maps MySQL duplicate-key and FK constraint errors to HTTP-friendly exceptions. */
export function rethrowPersistenceError(
  err: unknown,
  context: { duplicate?: string; restricted?: string },
): never {
  if (err instanceof QueryFailedError) {
    const driverErr = err.driverError as { errno?: number; code?: string };
    if (driverErr.errno === 1062 || driverErr.code === 'ER_DUP_ENTRY') {
      throw new ConflictException(
        context.duplicate ?? 'A record with the same unique fields already exists',
      );
    }
    if (driverErr.errno === 1451 || driverErr.code === 'ER_ROW_IS_REFERENCED_2') {
      throw new ConflictException(
        context.restricted ??
          'Cannot delete or update: record is referenced by other data',
      );
    }
  }
  throw err;
}