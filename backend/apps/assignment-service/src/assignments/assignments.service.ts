import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, IsNull, Repository } from 'typeorm';
import { ProductTechLead, RfpRequirement, TechnicalAssignment } from '../entities';
import { REQUIREMENT_STATUS, SUBJECT, TECH_STATUS } from '../common/statuses';
import { LookupService } from '../common/lookup.service';
import { ROLES, UsersClient } from '../integrations/users.client';
import { RfpClient } from '../integrations/rfp.client';
import { NotificationClient } from '../integrations/notification.client';
import { OpportunityClient } from '../integrations/opportunity.client';
import { HistoryService } from '../history/history.service';
import { ASSIGNMENT_EVENTS, AssignmentEventPublisher } from '../events/assignment-event.publisher';
import { ProductVerticalsService } from '../product-verticals/product-verticals.service';
import { classifyRequirement, productsOf, RequirementInput } from './requirement-rules';
import { ListAssignmentsQueryDto } from './assignments.dto';

type Person = { id: string; name: string };

/** OPP ids are stored in their public form, e.g. OPP-2026-00001. */
const normalizeOpp = (id: string) => id.trim().toUpperCase();

/**
 * Technical assignments (PRD US-15):
 *   RFP requirements → mapped to a product → one proposed assignment per product (default Tech Lead)
 *   → Solution Manager approves / changes / returns → on approval: notify the Tech Lead and add
 *   them to the opportunity's People. Unmapped or unclear requirements wait in the review queue.
 */
@Injectable()
export class AssignmentsService {
  constructor(
    @InjectRepository(TechnicalAssignment)
    private readonly assignments: Repository<TechnicalAssignment>,
    @InjectRepository(RfpRequirement)
    private readonly requirements: Repository<RfpRequirement>,
    private readonly dataSource: DataSource,
    private readonly lookup: LookupService,
    private readonly users: UsersClient,
    private readonly rfp: RfpClient,
    private readonly notifications: NotificationClient,
    private readonly opportunities: OpportunityClient,
    private readonly productVerticals: ProductVerticalsService,
    private readonly history: HistoryService,
    private readonly events: AssignmentEventPublisher,
  ) {}

  // ================= Reads =================

  async list(q: ListAssignmentsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const qb = this.assignments.createQueryBuilder('a').orderBy('a.updatedAt', 'DESC');
    if (q.opportunityId) qb.andWhere('a.opportunityId = :opp', { opp: normalizeOpp(q.opportunityId) });
    if (q.status) qb.andWhere('a.status = :status', { status: q.status });
    if (q.productTsp) qb.andWhere('a.productTsp = :product', { product: q.productTsp });
    if (q.techLeadUserId != null) {
      qb.andWhere('(a.techLeadUserId = :lead OR a.proposedTechLeadUserId = :lead)', {
        lead: String(q.techLeadUserId),
      });
    }
    const [items, total] = await qb.skip((page - 1) * limit).take(limit).getManyAndCount();
    return { items, total, page, limit };
  }

  /** One assignment with the requirements it covers. */
  async get(id: string) {
    const a = await this.assignments.findOneBy({ id });
    if (!a) throw new NotFoundException(`Technical assignment ${id} not found`);
    const requirements = await this.requirements.find({
      where: { technicalAssignmentId: a.id },
      order: { id: 'ASC' },
    });
    return { ...a, requirements };
  }

  /** Everything for one opportunity: its assignments and its review queue. */
  async forOpportunity(opportunityId: string) {
    const opp = normalizeOpp(opportunityId);
    const [assignments, requirements] = await Promise.all([
      this.assignments.find({ where: { opportunityId: opp }, order: { productTsp: 'ASC' } }),
      this.requirements.find({ where: { opportunityId: opp }, order: { id: 'ASC' } }),
    ]);
    return {
      opportunityId: opp,
      assignments: assignments.map((a) => ({
        ...a,
        requirements: requirements.filter((r) => r.technicalAssignmentId === a.id),
      })),
      reviewQueue: requirements.filter((r) => r.status !== REQUIREMENT_STATUS.MAPPED),
    };
  }

  /** Requirements waiting for a person to decide (all opportunities, or one). */
  reviewQueue(opportunityId?: string) {
    return this.requirements.find({
      where: {
        status: In([REQUIREMENT_STATUS.UNMAPPED, REQUIREMENT_STATUS.NEEDS_REVIEW]),
        ...(opportunityId ? { opportunityId: normalizeOpp(opportunityId) } : {}),
      },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  // ================= Requirements in =================

  /** Requirements sent to this service (by the RFP Service or by hand), then proposals are created. */
  async addRequirements(opportunityId: string, inputs: RequirementInput[], actorUserId?: number) {
    const opp = await this.lookup.opportunity(opportunityId);
    return this.saveRequirementsAndPropose(opp.publicId, inputs, 'API', actorUserId);
  }

  /**
   * Auto-assign for an opportunity:
   *  1. no requirements yet → fetch confirmed ones from the RFP Service
   *  2. re-check review items that have one product (e.g. the master was fixed since)
   *  3. create / update proposals
   */
  async autoAssign(opportunityId: string, actorUserId?: number) {
    const opp = await this.lookup.opportunity(opportunityId);
    const existing = await this.requirements.count({ where: { opportunityId: opp.publicId } });

    if (existing === 0) {
      const fromRfp = await this.rfp.getConfirmedRequirements(opp.publicId);
      if (!fromRfp.length) {
        throw new BadRequestException(
          `No confirmed RFP requirements found for ${opp.publicId}; send them with POST /assignments/opportunity/${opp.publicId}/requirements`,
        );
      }
      return this.saveRequirementsAndPropose(opp.publicId, fromRfp, 'RFP', actorUserId);
    }

    const toRecheck = await this.requirements.find({
      where: { opportunityId: opp.publicId, status: REQUIREMENT_STATUS.NEEDS_REVIEW },
    });
    const singleProduct = toRecheck.filter((r) => r.productTsp);
    const problems = await this.leadProblems(singleProduct.map((r) => r.productTsp!));

    await this.dataSource.transaction(async (manager) => {
      for (const r of singleProduct) {
        const result = classifyRequirement([r.productTsp!], (p) => problems.get(p) ?? null);
        if (result.status !== REQUIREMENT_STATUS.MAPPED) continue;
        await manager.update(RfpRequirement, r.id, { status: result.status, reviewReason: null });
        await this.history.record(manager, {
          subjectType: SUBJECT.REQUIREMENT, subjectId: r.id, opportunityId: r.opportunityId,
          action: 'MAPPED', fromStatus: r.status, toStatus: result.status, actorUserId,
          comment: 'Re-checked: default Tech Lead is now available',
        });
      }
      await this.proposeForMappedRequirements(manager, opp.publicId, actorUserId);
    });
    return this.forOpportunity(opp.publicId);
  }

  /** Review queue: set (or clear) a requirement's product. Mapped requirements join a proposal. */
  async mapRequirement(requirementId: string, productTsp: string | null | undefined, actorUserId?: number) {
    if (productTsp === undefined) {
      throw new BadRequestException('productTsp is required (null = not mapped)');
    }
    const req = await this.requirements.findOneBy({ id: requirementId });
    if (!req) throw new NotFoundException(`Requirement ${requirementId} not found`);

    const products = productsOf({ productTsp });
    const problems = await this.leadProblems(products);
    const result = classifyRequirement(products, (p) => problems.get(p) ?? null);

    await this.dataSource.transaction(async (manager) => {
      const productChanged = req.productTsp !== result.productTsp;
      await manager.update(RfpRequirement, req.id, {
        productTsp: result.productTsp,
        status: result.status,
        reviewReason: result.reviewReason,
        ...(productChanged ? { technicalAssignmentId: null } : {}),
      });
      await this.history.record(manager, {
        subjectType: SUBJECT.REQUIREMENT, subjectId: req.id, opportunityId: req.opportunityId,
        action: result.status === REQUIREMENT_STATUS.MAPPED ? 'MAPPED' : 'SENT_TO_REVIEW',
        fromStatus: req.status, toStatus: result.status, actorUserId,
        comment: result.reviewReason ?? `Mapped to ${result.productTsp}`,
      });
      await this.proposeForMappedRequirements(manager, req.opportunityId, actorUserId);
    });
    return this.requirements.findOneByOrFail({ id: req.id });
  }

  // ================= Proposals and decisions =================

  /** Propose a Tech Lead by hand for a product (e.g. no default in the master). */
  async proposeManually(
    opportunityId: string,
    dto: { productTsp: string; techLeadUserId: number; comment?: string | null },
    actorUserId?: number,
  ) {
    const opp = await this.lookup.opportunity(opportunityId);
    const lead = await this.lookup.activeUser(dto.techLeadUserId, 'Tech Lead');
    const productTsp = dto.productTsp.trim();
    const master = await this.productVerticals.findByProduct(productTsp);

    const id = await this.dataSource.transaction(async (manager) => {
      const a = await this.upsertProposal(manager, {
        opportunityId: opp.publicId, productTsp, lead, vertical: master?.vertical ?? null,
        actorUserId, replacePending: true, comment: dto.comment ?? null,
      });
      // Requirements of this product that were waiting for review now belong to this proposal.
      const waiting = await manager.find(RfpRequirement, {
        where: { opportunityId: opp.publicId, productTsp, technicalAssignmentId: IsNull() },
      });
      if (waiting.length) {
        await manager.update(RfpRequirement, waiting.map((r) => r.id), {
          status: REQUIREMENT_STATUS.MAPPED, reviewReason: null, technicalAssignmentId: a.id,
        });
      }
      return a.id;
    });
    return this.get(id);
  }

  /** Solution Manager approves: final Tech Lead set, Tech Lead notified, added to the opportunity's People. */
  async approve(id: string, comment: string | null | undefined, actorUserId?: number) {
    const solutionManager = await this.lookup.requireRole(actorUserId, ROLES.SOLUTION_MANAGER, 'approve technical assignments');
    const current = await this.get(id);
    if (current.status !== TECH_STATUS.PENDING_APPROVAL) {
      throw new BadRequestException(`Only ${TECH_STATUS.PENDING_APPROVAL} assignments can be approved (this one is ${current.status})`);
    }
    if (!current.proposedTechLeadUserId) {
      throw new BadRequestException('No Tech Lead proposed yet; use POST /assignments/:id/change to choose one');
    }
    const lead = await this.lookup.activeUser(current.proposedTechLeadUserId, 'Tech Lead');

    await this.dataSource.transaction(async (tx) => {
      const a = await this.lockAssignment(tx, id);
      if (a.status !== TECH_STATUS.PENDING_APPROVAL || a.version !== current.version) {
        throw new ConflictException('The assignment was changed meanwhile; reload and try again');
      }
      Object.assign(a, {
        status: TECH_STATUS.APPROVED,
        techLeadUserId: lead.id,
        techLeadName: lead.name,
        decidedByUserId: solutionManager.id,
        decidedAt: new Date(),
        decisionComment: comment ?? null,
      });
      await tx.save(a);
      await this.history.record(tx, {
        subjectType: SUBJECT.TECHNICAL_ASSIGNMENT, subjectId: a.id, opportunityId: a.opportunityId,
        action: 'APPROVED', fromStatus: TECH_STATUS.PENDING_APPROVAL, toStatus: a.status,
        actorUserId: solutionManager.id, comment, snapshot: a,
      });
      await this.events.publish(tx, {
        eventType: ASSIGNMENT_EVENTS.TECH_ASSIGNMENT_CREATED,
        subjectType: SUBJECT.TECHNICAL_ASSIGNMENT, subjectId: a.id, opportunityId: a.opportunityId,
        data: { productTsp: a.productTsp, techLeadUserId: a.techLeadUserId, techLeadName: a.techLeadName, version: a.version },
      });
    });

    // After the approval is saved: notify + sync. Failures are reported, never undo the approval.
    const warnings: string[] = [];
    const sent = await this.notifications.send({
      toUserId: lead.id,
      toName: lead.name,
      kind: 'TECHNICAL_ASSIGNMENT',
      title: `You are the ${current.productTsp} Tech Lead for ${current.opportunityId}`,
      message: `${solutionManager.name} approved you as Tech Lead for the ${current.productTsp} workstream (${current.requirements.length} requirement(s)).`,
      link: `/opportunities/${current.opportunityId}`,
    });
    if (sent) await this.assignments.update(id, { notifiedAt: new Date() });
    else warnings.push('Tech Lead was not notified (Notification Service unavailable)');

    try {
      await this.opportunities.addDealTeamMember(
        current.opportunityId,
        { n: lead.name, r: `Tech Lead (${current.productTsp})` },
        solutionManager.id,
      );
    } catch (err) {
      warnings.push(`Opportunity People not updated: ${err instanceof Error ? err.message : err}`);
    }

    const result = await this.get(id);
    return warnings.length ? { ...result, warnings } : result;
  }

  /** Solution Manager proposes a different Tech Lead. It must be approved again. */
  async change(id: string, techLeadUserId: number, comment: string | null | undefined, actorUserId?: number) {
    const solutionManager = await this.lookup.requireRole(actorUserId, ROLES.SOLUTION_MANAGER, 'change technical assignments');
    const lead = await this.lookup.activeUser(techLeadUserId, 'Tech Lead');

    await this.dataSource.transaction(async (tx) => {
      const a = await this.lockAssignment(tx, id);
      if (a.status === TECH_STATUS.CANCELLED) {
        throw new BadRequestException('A cancelled assignment cannot be changed');
      }
      const fromStatus = a.status;
      Object.assign(a, {
        status: TECH_STATUS.PENDING_APPROVAL,
        proposedTechLeadUserId: lead.id,
        proposedTechLeadName: lead.name,
        version: a.version + 1,
        decidedByUserId: null,
        decidedAt: null,
        decisionComment: comment ?? null,
      });
      await tx.save(a);
      await this.history.record(tx, {
        subjectType: SUBJECT.TECHNICAL_ASSIGNMENT, subjectId: a.id, opportunityId: a.opportunityId,
        action: 'CHANGED', fromStatus, toStatus: a.status, actorUserId: solutionManager.id, comment, snapshot: a,
      });
      await this.events.publish(tx, {
        eventType: ASSIGNMENT_EVENTS.TECH_ASSIGNMENT_PROPOSED,
        subjectType: SUBJECT.TECHNICAL_ASSIGNMENT, subjectId: a.id, opportunityId: a.opportunityId,
        data: { productTsp: a.productTsp, proposedTechLeadUserId: lead.id, version: a.version },
      });
    });
    return this.get(id);
  }

  /** Solution Manager returns / rejects the proposal (with a reason). */
  async returnAssignment(id: string, comment: string, actorUserId?: number) {
    const solutionManager = await this.lookup.requireRole(actorUserId, ROLES.SOLUTION_MANAGER, 'return technical assignments');

    await this.dataSource.transaction(async (tx) => {
      const a = await this.lockAssignment(tx, id);
      if (a.status !== TECH_STATUS.PENDING_APPROVAL) {
        throw new BadRequestException(`Only ${TECH_STATUS.PENDING_APPROVAL} assignments can be returned (this one is ${a.status})`);
      }
      Object.assign(a, {
        status: TECH_STATUS.RETURNED,
        decidedByUserId: solutionManager.id,
        decidedAt: new Date(),
        decisionComment: comment,
      });
      await tx.save(a);
      await this.history.record(tx, {
        subjectType: SUBJECT.TECHNICAL_ASSIGNMENT, subjectId: a.id, opportunityId: a.opportunityId,
        action: 'RETURNED', fromStatus: TECH_STATUS.PENDING_APPROVAL, toStatus: a.status,
        actorUserId: solutionManager.id, comment, snapshot: a,
      });
      await this.events.publish(tx, {
        eventType: ASSIGNMENT_EVENTS.TECH_ASSIGNMENT_RETURNED,
        subjectType: SUBJECT.TECHNICAL_ASSIGNMENT, subjectId: a.id, opportunityId: a.opportunityId,
        data: { productTsp: a.productTsp, reason: comment },
      });
    });
    return this.get(id);
  }

  // ================= Helpers =================

  /** Saves new requirements (skipping refs already received) and creates proposals, in one transaction. */
  private async saveRequirementsAndPropose(
    opportunityId: string,
    inputs: RequirementInput[],
    source: 'API' | 'RFP',
    actorUserId?: number,
  ) {
    const problems = await this.leadProblems(inputs.flatMap((i) => productsOf(i)));
    const known = await this.requirements.find({ where: { opportunityId }, select: { requirementRef: true } });
    const knownRefs = new Set(known.map((r) => r.requirementRef).filter(Boolean));

    let added = 0;
    await this.dataSource.transaction(async (manager) => {
      for (const input of inputs) {
        const ref = input.requirementRef?.trim() || null;
        if (ref && knownRefs.has(ref)) continue; // already received
        if (ref) knownRefs.add(ref);
        const result = classifyRequirement(productsOf(input), (p) => problems.get(p) ?? null);
        await manager.save(
          manager.create(RfpRequirement, {
            opportunityId,
            requirementRef: ref,
            title: input.title.trim(),
            details: input.details ?? null,
            productTsp: result.productTsp,
            status: result.status,
            reviewReason: result.reviewReason,
            source,
            createdByUserId: actorUserId != null ? String(actorUserId) : null,
          }),
        );
        added += 1;
      }
      if (added) {
        await this.events.publish(manager, {
          eventType: ASSIGNMENT_EVENTS.REQUIREMENTS_RECEIVED,
          subjectType: SUBJECT.REQUIREMENT, subjectId: '0', opportunityId,
          data: { count: added, source },
        });
      }
      await this.proposeForMappedRequirements(manager, opportunityId, actorUserId);
    });

    return { added, skippedAsDuplicate: inputs.length - added, ...(await this.forOpportunity(opportunityId)) };
  }

  /** Groups MAPPED requirements that have no assignment yet by product, and proposes the default Tech Lead. */
  private async proposeForMappedRequirements(manager: EntityManager, opportunityId: string, actorUserId?: number) {
    const open = await manager.find(RfpRequirement, {
      where: { opportunityId, status: REQUIREMENT_STATUS.MAPPED, technicalAssignmentId: IsNull() },
    });
    const byProduct = new Map<string, RfpRequirement[]>();
    for (const r of open) byProduct.set(r.productTsp!, [...(byProduct.get(r.productTsp!) ?? []), r]);

    for (const [productTsp, reqs] of byProduct) {
      const master = await manager.findOneBy(ProductTechLead, { productTsp });
      const lead = master?.techLeadUserId
        ? { id: master.techLeadUserId, name: master.techLeadName ?? `User ${master.techLeadUserId}` }
        : null;
      const a = await this.upsertProposal(manager, {
        opportunityId, productTsp, lead, vertical: master?.vertical ?? null, actorUserId,
        replacePending: false, comment: null,
      });
      await manager.update(RfpRequirement, reqs.map((r) => r.id), { technicalAssignmentId: a.id });
    }
  }

  /**
   * Creates the opportunity + product assignment, or re-proposes it.
   * - none yet            → new PENDING_APPROVAL (version 1)
   * - RETURNED / CANCELLED → PENDING_APPROVAL again (version + 1)
   * - PENDING_APPROVAL    → replaced only for a manual proposal (version + 1)
   * - APPROVED            → kept (new requirements just join it); a manual proposal must use "change"
   */
  private async upsertProposal(
    manager: EntityManager,
    p: {
      opportunityId: string; productTsp: string; lead: Person | null; vertical: string | null;
      actorUserId?: number; replacePending: boolean; comment: string | null;
    },
  ): Promise<TechnicalAssignment> {
    const repo = manager.getRepository(TechnicalAssignment);
    let a = await repo.findOne({
      where: { opportunityId: p.opportunityId, productTsp: p.productTsp },
      lock: { mode: 'pessimistic_write' },
    });
    const fromStatus = a?.status ?? null;

    if (a && a.status === TECH_STATUS.APPROVED) {
      if (p.replacePending) {
        throw new ConflictException(`The ${p.productTsp} assignment is already approved; use POST /assignments/${a.id}/change`);
      }
      return a;
    }
    if (a && a.status === TECH_STATUS.PENDING_APPROVAL && !p.replacePending) return a;

    if (!a) {
      a = repo.create({ opportunityId: p.opportunityId, productTsp: p.productTsp, version: 1 });
    } else {
      a.version += 1;
    }
    Object.assign(a, {
      status: TECH_STATUS.PENDING_APPROVAL,
      vertical: p.vertical,
      proposedTechLeadUserId: p.lead?.id ?? null,
      proposedTechLeadName: p.lead?.name ?? null,
      proposedByUserId: p.actorUserId != null ? String(p.actorUserId) : null,
      decidedByUserId: null,
      decidedAt: null,
      decisionComment: p.comment,
    });
    a = await repo.save(a);

    await this.history.record(manager, {
      subjectType: SUBJECT.TECHNICAL_ASSIGNMENT, subjectId: a.id, opportunityId: a.opportunityId,
      action: fromStatus ? 'PROPOSED_AGAIN' : 'PROPOSED', fromStatus, toStatus: a.status,
      actorUserId: p.actorUserId, comment: p.comment, snapshot: a,
    });
    await this.events.publish(manager, {
      eventType: ASSIGNMENT_EVENTS.TECH_ASSIGNMENT_PROPOSED,
      subjectType: SUBJECT.TECHNICAL_ASSIGNMENT, subjectId: a.id, opportunityId: a.opportunityId,
      data: { productTsp: a.productTsp, proposedTechLeadUserId: a.proposedTechLeadUserId, version: a.version },
    });
    return a;
  }

  private async lockAssignment(manager: EntityManager, id: string): Promise<TechnicalAssignment> {
    const a = await manager.getRepository(TechnicalAssignment).findOne({
      where: { id },
      lock: { mode: 'pessimistic_write' },
    });
    if (!a) throw new NotFoundException(`Technical assignment ${id} not found`);
    return a;
  }

  /** For each product: why its default Tech Lead can't be used, or null when it can. */
  private async leadProblems(products: string[]): Promise<Map<string, string | null>> {
    const result = new Map<string, string | null>();
    for (const productTsp of new Set(products)) {
      const master = await this.productVerticals.findByProduct(productTsp);
      if (!master || !master.active || !master.techLeadUserId) {
        result.set(productTsp, `No default Tech Lead is set for ${productTsp}`);
        continue;
      }
      const user = await this.users.getUser(master.techLeadUserId);
      if (!user) result.set(productTsp, `Default Tech Lead for ${productTsp} (user ${master.techLeadUserId}) not found`);
      else if (!user.active) result.set(productTsp, `Default Tech Lead ${user.name} for ${productTsp} is inactive`);
      else result.set(productTsp, null);
    }
    return result;
  }
}
