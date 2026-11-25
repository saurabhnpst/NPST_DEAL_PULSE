import { callService } from './http-call';

/**
 * The Opportunity Service (backend/apps/opportunity-service, port 3005).
 * Real:  OPPORTUNITY_SERVICE_URL set, e.g. http://localhost:3005 → its existing APIs:
 *          GET   /api/v1/opportunities/:id
 *          PATCH /api/v1/opportunities/:id/contributors   (presalesUserId, presalesName, dealTeam)
 * Mock:  otherwise → any id shaped like OPP-YYYY-NNNNN exists; changes are kept in memory.
 */

export type DealTeamMember = { n: string; r: string; teamsAt?: string };

/** Only the fields this service needs. */
export type OpportunitySummary = {
  id: string;
  publicId: string;
  name: string;
  accountName: string;
  stage: string;
  products: { productSlot: number; productTsp: string; modules: string[] }[];
  presalesUserId: string | null;
  presalesName: string | null;
  dealTeam: DealTeamMember[];
};

export abstract class OpportunityClient {
  abstract readonly mode: 'mock' | 'real';

  /** null when the opportunity doesn't exist (or was deleted). */
  abstract getOpportunity(opportunityId: string): Promise<OpportunitySummary | null>;

  /** Sets the opportunity's Pre-Sales owner (shown as "Pre-Sales owner" in the frontend). */
  abstract setPresalesOwner(
    opportunityId: string,
    owner: { userId: string | null; name: string | null },
    actorUserId?: string | number | null,
  ): Promise<void>;

  /** Adds a person to the opportunity's "People" panel, unless already listed with that role. */
  abstract addDealTeamMember(
    opportunityId: string,
    member: DealTeamMember,
    actorUserId?: string | number | null,
  ): Promise<void>;
}

const isPublicId = (id: string) => /^OPP-\d{4}-\d{5}$/i.test(id);
const alreadyListed = (team: DealTeamMember[], m: DealTeamMember) =>
  team.some((p) => p.n === m.n && p.r === m.r);

export class HttpOpportunityClient extends OpportunityClient {
  readonly mode = 'real' as const;

  constructor(private readonly baseUrl: string) {
    super();
  }

  async getOpportunity(opportunityId: string): Promise<OpportunitySummary | null> {
    const o = await callService<OpportunitySummary>(
      'Opportunity Service',
      this.baseUrl,
      `/api/v1/opportunities/${encodeURIComponent(opportunityId)}`,
    );
    return o ? { ...o, dealTeam: o.dealTeam ?? [] } : null;
  }

  async setPresalesOwner(
    opportunityId: string,
    owner: { userId: string | null; name: string | null },
    actorUserId?: string | number | null,
  ): Promise<void> {
    await this.patchContributors(
      opportunityId,
      { presalesUserId: owner.userId != null ? Number(owner.userId) : null, presalesName: owner.name },
      actorUserId,
    );
  }

  async addDealTeamMember(
    opportunityId: string,
    member: DealTeamMember,
    actorUserId?: string | number | null,
  ): Promise<void> {
    const opp = await this.getOpportunity(opportunityId);
    if (!opp || alreadyListed(opp.dealTeam, member)) return;
    await this.patchContributors(opportunityId, { dealTeam: [...opp.dealTeam, member] }, actorUserId);
  }

  private async patchContributors(
    opportunityId: string,
    body: Record<string, unknown>,
    actorUserId?: string | number | null,
  ): Promise<void> {
    await callService(
      'Opportunity Service',
      this.baseUrl,
      `/api/v1/opportunities/${encodeURIComponent(opportunityId)}/contributors`,
      { method: 'PATCH', body, actorUserId },
    );
  }
}

export class MockOpportunityClient extends OpportunityClient {
  readonly mode = 'mock' as const;
  /** In-memory opportunities, created on first use. */
  readonly store = new Map<string, OpportunitySummary>();

  async getOpportunity(opportunityId: string): Promise<OpportunitySummary | null> {
    const key = opportunityId.toUpperCase();
    if (!isPublicId(key)) return null;
    if (!this.store.has(key)) {
      this.store.set(key, {
        id: String(this.store.size + 1),
        publicId: key,
        name: `Demo opportunity ${key}`,
        accountName: 'Demo Bank',
        stage: 'Qualification',
        products: [{ productSlot: 1, productTsp: 'UPI', modules: [] }],
        presalesUserId: null,
        presalesName: null,
        dealTeam: [],
      });
    }
    return this.store.get(key)!;
  }

  async setPresalesOwner(
    opportunityId: string,
    owner: { userId: string | null; name: string | null },
  ): Promise<void> {
    const opp = await this.getOpportunity(opportunityId);
    if (opp) Object.assign(opp, { presalesUserId: owner.userId, presalesName: owner.name });
  }

  async addDealTeamMember(opportunityId: string, member: DealTeamMember): Promise<void> {
    const opp = await this.getOpportunity(opportunityId);
    if (opp && !alreadyListed(opp.dealTeam, member)) opp.dealTeam.push(member);
  }
}
