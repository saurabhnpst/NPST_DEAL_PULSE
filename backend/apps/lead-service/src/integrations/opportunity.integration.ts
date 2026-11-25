import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Lead } from '../entities/lead.entity';

export interface LeadConversionPayload {
  leadId: string;
  convertedBy?: string;
}

export interface LeadConversionResult {
  opportunityId: string;
}

type OpportunityCreateBody = {
  name: string;
  accountName: string;
  closeDate: string;
  stage?: string;
  arr: number;
  oneTime?: number;
  products: Array<{ productSlot: number; productTsp: string; modules: string[] }>;
  ownerUserId?: number;
  recordType?: string;
  leadSource?: string;
};

@Injectable()
export class OpportunityIntegration {
  private readonly logger = new Logger(OpportunityIntegration.name);

  constructor(private readonly config: ConfigService) {}

  private baseUrl(): string {
    const raw =
      this.config.get<string>('OPPORTUNITY_SERVICE_URL')?.replace(/\/$/, '') ||
      'http://localhost:3003';
    return raw;
  }

  private mapLeadToCreate(lead: Lead): OpportunityCreateBody {
    const close = new Date();
    close.setDate(close.getDate() + 90);
    const account = (lead.company || `${lead.firstName ?? ''} ${lead.lastName ?? ''}`).trim();
    const name =
      account ||
      `Opportunity from lead ${lead.id.slice(0, 8)}`;
    const tsp = lead.productTsp?.trim() || lead.product?.trim() || 'TSP';
    return {
      name: name.slice(0, 120),
      accountName: (account || name).slice(0, 255),
      closeDate: close.toISOString().slice(0, 10),
      stage: 'Qualification',
      arr: 0,
      oneTime: 0,
      products: [{ productSlot: 1, productTsp: tsp.slice(0, 64), modules: [] }],
      // carry over owner / vertical / source from the lead (v14: "Converting a lead carries over account, product, source and owner")
      ...(/^\d+$/.test(lead.ownerId ?? '') ? { ownerUserId: Number(lead.ownerId) } : {}),
      ...(lead.leadRecordType ? { recordType: lead.leadRecordType.includes('PPAS') ? 'PPAS' : 'TSP' } : {}),
      ...(lead.leadSource ? { leadSource: lead.leadSource } : {}),
    };
  }

  /**
   * Creates an Opportunity via Opportunity Service HTTP API. Does not write opportunity_db from Lead Service.
   */
  async convertLeadToOpportunity(
    lead: Lead,
    payload: LeadConversionPayload,
  ): Promise<LeadConversionResult> {
    const url = `${this.baseUrl()}/api/v1/opportunities`;
    const body = this.mapLeadToCreate(lead);
    this.logger.log(
      `Converting lead ${payload.leadId} → POST ${url} (by=${payload.convertedBy ?? 'unknown'})`,
    );
    let res: Response;
    try {
      res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(payload.convertedBy ? { 'x-changed-by': payload.convertedBy } : {}),
        },
        body: JSON.stringify(body),
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Network error';
      this.logger.error(`Opportunity Service unreachable: ${message}`);
      throw new ServiceUnavailableException(
        `Opportunity Service unavailable: ${message}`,
      );
    }
    const text = await res.text();
    let json: unknown;
    try {
      json = text ? JSON.parse(text) : {};
    } catch {
      throw new ServiceUnavailableException(
        `Opportunity Service returned non-JSON (${res.status})`,
      );
    }
    if (!res.ok) {
      const msg =
        typeof json === 'object' &&
        json !== null &&
        'error' in json &&
        typeof (json as { error?: { message?: string } }).error?.message === 'string'
          ? (json as { error: { message: string } }).error.message
          : text.slice(0, 200);
      this.logger.error(`Opportunity create failed (${res.status}): ${msg}`);
      throw new ServiceUnavailableException(
        `Opportunity create failed: ${msg}`,
      );
    }
    const data =
      typeof json === 'object' && json !== null && 'data' in json
        ? (json as { data: { id?: string; publicId?: string } }).data
        : (json as { id?: string; publicId?: string });
    // Prefer the public id (OPP-YYYY-NNNNN) — that is what the portal shows and links to.
    const opportunityId = data?.publicId ?? data?.id;
    if (!opportunityId) {
      throw new ServiceUnavailableException(
        'Opportunity Service did not return an opportunity id',
      );
    }
    return { opportunityId };
  }
}