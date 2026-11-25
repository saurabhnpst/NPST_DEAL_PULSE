import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { Decision } from '../decisions/decision.types';

/** Lead Service endpoint for each approval outcome. */
const LEAD_ACTION: Record<Decision['outcome'], string> = {
  APPROVED: 'approve', // Qualified + opportunity created
  REJECTED: 'reject', // Unqualified, reason kept
  CHANGES_REQUESTED: 'send-back', // back to Sales (Working)
};

/**
 * Applies an approval decision to the lead in Lead Service (HTTP, no shared database).
 * Lead endpoints are safe to repeat, so if this call fails the approver can simply retry the same action.
 */
@Injectable()
export class LeadClient {
  private readonly logger = new Logger(LeadClient.name);

  private baseUrl(): string {
    return (process.env.LEAD_SERVICE_URL || 'http://localhost:3002').replace(/\/$/, '');
  }

  async applyDecision(leadId: string, decision: Decision, changedBy?: string): Promise<void> {
    const url = `${this.baseUrl()}/api/v1/leads/${encodeURIComponent(leadId)}/${LEAD_ACTION[decision.outcome]}`;
    const body = decision.outcome === 'REJECTED' ? { reason: decision.reason ?? '' } : {};
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(changedBy ? { 'x-changed-by': changedBy } : {}) },
        body: JSON.stringify(body),
      });
    } catch (err) {
      this.logger.error(`Lead Service unreachable: ${err instanceof Error ? err.message : String(err)}`);
      throw new ServiceUnavailableException('Decision recorded, but Lead Service is unreachable. Retry the same action to update the lead.');
    }
    if (!res.ok) {
      const text = (await res.text()).slice(0, 300);
      this.logger.error(`Lead ${leadId} ${LEAD_ACTION[decision.outcome]} failed (${res.status}): ${text}`);
      throw new ServiceUnavailableException(`Decision recorded, but updating the lead failed (${res.status}). Retry the same action.`);
    }
  }
}
