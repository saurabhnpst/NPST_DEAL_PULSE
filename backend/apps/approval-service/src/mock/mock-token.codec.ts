import { Injectable } from '@nestjs/common';
import { createHmac, timingSafeEqual } from 'crypto';
import { ApprovalConfigService } from '../shared/config';
import { DomainError, forbiddenError } from '../shared/errors';
import { SignedActorPayload } from './actor.types';

@Injectable()
export class MockTokenCodec {
  constructor(private readonly config: ApprovalConfigService) {}

  sign(actorId: string): string {
    const payload: SignedActorPayload = {
      actorId,
      exp: Math.floor(Date.now() / 1000) + this.config.tokenTtlSeconds,
    };
    const encoded = Buffer.from(JSON.stringify(payload)).toString('base64url');
    return `${encoded}.${this.signPayload(encoded)}`;
  }

  verify(token: string): SignedActorPayload {
    const [encoded, signature, extra] = token.split('.');
    if (encoded === undefined || signature === undefined || extra !== undefined) {
      throw forbiddenError('Invalid mock token');
    }
    const expected = this.signPayload(encoded);
    if (!this.signaturesEqual(signature, expected)) {
      throw forbiddenError('Invalid mock token');
    }
    const payload = this.decodePayload(encoded);
    if (payload.exp <= Math.floor(Date.now() / 1000)) {
      throw forbiddenError('Mock token expired');
    }
    return payload;
  }

  private signPayload(payload: string): string {
    return createHmac('sha256', this.config.tokenSecret).update(payload).digest('base64url');
  }

  private signaturesEqual(actual: string, expected: string): boolean {
    const actualBuffer = Buffer.from(actual);
    const expectedBuffer = Buffer.from(expected);
    if (actualBuffer.length !== expectedBuffer.length) {
      return false;
    }
    return timingSafeEqual(actualBuffer, expectedBuffer);
  }

  private decodePayload(encoded: string): SignedActorPayload {
    try {
      const parsed: unknown = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf8'));
      if (typeof parsed !== 'object' || parsed === null) {
        throw forbiddenError('Invalid mock token');
      }
      const record = parsed as Record<string, unknown>;
      if (typeof record['actorId'] !== 'string' || typeof record['exp'] !== 'number') {
        throw forbiddenError('Invalid mock token');
      }
      return { actorId: record['actorId'], exp: record['exp'] };
    } catch (error) {
      if (error instanceof DomainError) {
        throw error;
      }
      throw forbiddenError('Invalid mock token');
    }
  }
}
