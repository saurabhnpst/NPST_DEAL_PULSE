import { BadRequestException, ConflictException, Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Rfp } from '../entities/rfp.entity';
import { RfpsService } from './rfps.service';

const url = (name: string, fallback: string) => (process.env[name] || fallback).replace(/\/$/, '');
const numericId = (v?: string) => (v && /^\d+$/.test(v) ? Number(v) : undefined);

/**
 * RFP synopsis decision by Pre-Sales:
 * accept → create the opportunity (Opportunity Service) and link it to the RFP and the lead (Lead Service);
 * return → back to Sales with a note.
 */
@Injectable()
export class SynopsisWorkflowService {
  private readonly logger = new Logger(SynopsisWorkflowService.name);

  constructor(
    @InjectRepository(Rfp) private readonly rfpRepo: Repository<Rfp>,
    private readonly rfps: RfpsService,
  ) {}

  async accept(rfpId: string, presalesOwnerId: string | undefined, actorId?: string): Promise<Rfp> {
    const rfp = await this.rfps.findOne(rfpId);
    if (rfp.opportunityId) return rfp; // already accepted — safe to repeat
    if (rfp.synopsisStatus !== 'Submitted') throw new ConflictException('Only a submitted synopsis can be accepted');
    const opp = await this.createOpportunity(rfp, presalesOwnerId, actorId);
    Object.assign(rfp, { opportunityId: opp.publicId, synopsisStatus: 'Accepted', presalesOwnerId: presalesOwnerId ?? rfp.presalesOwnerId, returnNote: null });
    const saved = await this.rfpRepo.save(rfp);
    if (rfp.leadId) await this.linkLead(rfp.leadId, opp.publicId, actorId);
    return saved;
  }

  async returnToSales(rfpId: string, note: string): Promise<Rfp> {
    if (!note?.trim()) throw new BadRequestException('A note is required to return the synopsis');
    const rfp = await this.rfps.findOne(rfpId);
    if (rfp.synopsisStatus !== 'Submitted') throw new ConflictException('Only a submitted synopsis can be returned');
    Object.assign(rfp, { synopsisStatus: 'Returned', returnNote: note.trim() });
    return this.rfpRepo.save(rfp);
  }

  private async createOpportunity(rfp: Rfp, presalesOwnerId?: string, actorId?: string): Promise<{ publicId: string }> {
    const close = rfp.submissionDeadline ? new Date(rfp.submissionDeadline) : new Date(Date.now() + 90 * 864e5);
    const body = {
      name: rfp.title.slice(0, 120),
      accountName: (rfp.issuerName || rfp.title).slice(0, 255),
      closeDate: close.toISOString().slice(0, 10),
      stage: 'Qualification',
      tender: 'RFP',
      arr: 0,
      oneTime: Number(rfp.dealSize) || 0, // ARR / one-time split is not known from the synopsis; Sales updates commercials
      tag: 'RFP · Synopsis accepted',
      tone: 'green',
      ownerUserId: numericId(rfp.ownerId),
      presalesUserId: numericId(presalesOwnerId),
      products: [{ productSlot: 1, productTsp: (rfp.products || 'TSP').split(/[,;]/)[0].trim().slice(0, 64) || 'TSP', modules: [] }],
    };
    const data = await this.post(`${url('OPPORTUNITY_SERVICE_URL', 'http://localhost:3003')}/api/v1/opportunities`, body, actorId);
    const opp = (data as { data?: { publicId?: string } }).data;
    if (!opp?.publicId) throw new ServiceUnavailableException('Opportunity Service did not return an opportunity id');
    return { publicId: opp.publicId };
  }

  private async linkLead(leadId: string, opportunityId: string, actorId?: string): Promise<void> {
    try {
      await this.post(`${url('LEAD_SERVICE_URL', 'http://localhost:3002')}/api/v1/leads/${leadId}/link-opportunity`, { opportunityId }, actorId);
    } catch (err) {
      // the opportunity exists and is linked on the RFP; the lead link can be retried by accepting again
      this.logger.warn(`Lead ${leadId} not linked to ${opportunityId}: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  private async post(target: string, body: unknown, actorId?: string): Promise<unknown> {
    let res: Response;
    try {
      res = await fetch(target, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(actorId ? { 'x-user-id': actorId, 'x-changed-by': actorId } : {}) },
        body: JSON.stringify(body),
      });
    } catch (err) {
      throw new ServiceUnavailableException(`Service unreachable: ${target}`);
    }
    const text = await res.text();
    if (!res.ok) throw new ServiceUnavailableException(`Call failed (${res.status}): ${text.slice(0, 200)}`);
    return text ? JSON.parse(text) : {};
  }
}
