import { Injectable, Logger } from '@nestjs/common';

export type ReferenceCheckResult = {
  ok: boolean;
  skipped: boolean;
  message?: string;
};

@Injectable()
export class ExternalReferencesService {
  private readonly logger = new Logger(ExternalReferencesService.name);

  private baseUrl(service: 'auth' | 'document' | 'lead'): string | undefined {
    const map = {
      auth: process.env.AUTH_SERVICE_URL,
      document: process.env.DOCUMENT_SERVICE_URL,
      lead: process.env.LEAD_SERVICE_URL,
    };
    return map[service];
  }

  private strict(): boolean {
    return process.env.OPPORTUNITY_STRICT_EXT_REFS === 'true';
  }

  async validateUserId(userId: string | number | null | undefined): Promise<ReferenceCheckResult> {
    if (userId == null || userId === '') return { ok: true, skipped: true };
    const base = this.baseUrl('auth');
    if (!base) return { ok: true, skipped: true };
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/api/v1/users/${userId}`, {
        method: 'GET',
        headers: { accept: 'application/json' },
        signal: AbortSignal.timeout(3000),
      });
      if (res.ok) return { ok: true, skipped: false };
      if (this.strict()) {
        return { ok: false, skipped: false, message: `User ${userId} not found in Auth Service` };
      }
      this.logger.warn(`Auth Service rejected user ${userId} (${res.status}); continuing (non-strict mode)`);
      return { ok: true, skipped: false, message: 'User reference unverified (Auth Service unavailable)' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Auth Service unreachable';
      if (this.strict()) {
        return { ok: false, skipped: false, message };
      }
      this.logger.warn(`Auth Service check failed for user ${userId}: ${message}`);
      return { ok: true, skipped: false, message: 'User reference unverified (Auth Service unreachable)' };
    }
  }

  async validateDocumentId(documentId: string | number | null | undefined): Promise<ReferenceCheckResult> {
    if (documentId == null || documentId === '') return { ok: true, skipped: true };
    const base = this.baseUrl('document');
    if (!base) return { ok: true, skipped: true };
    try {
      const res = await fetch(
        `${base.replace(/\/$/, '')}/api/v1/documents/${documentId}`,
        { method: 'GET', headers: { accept: 'application/json' }, signal: AbortSignal.timeout(3000) },
      );
      if (res.ok) return { ok: true, skipped: false };
      if (this.strict()) {
        return { ok: false, skipped: false, message: `Document ${documentId} not found` };
      }
      this.logger.warn(`Document Service rejected id ${documentId} (${res.status})`);
      return { ok: true, skipped: false, message: 'PO document unverified (Document Service unavailable)' };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Document Service unreachable';
      if (this.strict()) return { ok: false, skipped: false, message };
      this.logger.warn(`Document check failed: ${message}`);
      return { ok: true, skipped: false, message: 'PO document unverified (Document Service unreachable)' };
    }
  }
}