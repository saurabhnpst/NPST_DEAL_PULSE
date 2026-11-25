import { ArgumentMetadata, Injectable, PipeTransform } from '@nestjs/common';

/**
 * Forms send `''` for an empty input (e.g. an unfilled date).
 * Turn top-level `''` into `null` so it means "no value" instead of failing validation.
 * Nested objects/arrays are left untouched.
 */
@Injectable()
export class EmptyStringToNullPipe implements PipeTransform {
  transform(value: unknown, metadata: ArgumentMetadata) {
    if (metadata.type !== 'body' && metadata.type !== 'query') return value;
    if (!value || typeof value !== 'object' || Array.isArray(value)) return value;

    const out: Record<string, unknown> = { ...(value as Record<string, unknown>) };
    for (const key of Object.keys(out)) {
      if (out[key] === '') out[key] = null;
    }
    return out;
  }
}
