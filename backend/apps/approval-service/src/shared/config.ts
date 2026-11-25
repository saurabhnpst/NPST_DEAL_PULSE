import { Injectable } from '@nestjs/common';
import { configurationError } from '../shared/errors';

const DEFAULT_LOCAL_ESCALATION_MS = 24 * 60 * 60 * 1000;
const DEFAULT_LOCAL_TOKEN_SECRET = 'approval-service-local-dev-secret';

@Injectable()
export class ApprovalConfigService {
  private readonly production = process.env['NODE_ENV'] === 'production';

  constructor() {
    this.validateEscalationConfig();
    this.validateTokenSecret();
  }

  get tokenSecret(): string {
    return process.env['APPROVAL_MOCK_TOKEN_SECRET'] ?? DEFAULT_LOCAL_TOKEN_SECRET;
  }

  get tokenTtlSeconds(): number {
    return this.readPositiveInteger('APPROVAL_TOKEN_TTL_SECONDS', 3600);
  }

  get escalationWindowMs(): number {
    return this.readPositiveInteger('APPROVAL_ESCALATION_MS', DEFAULT_LOCAL_ESCALATION_MS);
  }

  get escalationEnabled(): boolean {
    return process.env['APPROVAL_ESCALATION_ENABLED'] === 'true';
  }

  private validateEscalationConfig(): void {
    if (!this.production) {
      return;
    }
    const approved = process.env['APPROVAL_ESCALATION_APPROVED'] === 'true';
    if (!approved || process.env['APPROVAL_ESCALATION_MS'] === undefined) {
      throw configurationError('Production escalation requires approved business timeframe');
    }
  }

  private validateTokenSecret(): void {
    if (!this.production) {
      return;
    }
    throw configurationError(
      'Production requires Gateway JWT/M365 identity; mock token authentication is not permitted',
    );
  }

  private readPositiveInteger(name: string, fallback: number): number {
    const raw = process.env[name];
    if (raw === undefined) {
      return fallback;
    }
    const value = Number(raw);
    if (!Number.isInteger(value) || value <= 0) {
      throw configurationError(`${name} must be a positive integer`);
    }
    return value;
  }
}
