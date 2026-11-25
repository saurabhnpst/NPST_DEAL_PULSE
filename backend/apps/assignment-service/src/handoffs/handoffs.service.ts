import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PresalesHandoff } from '../entities';
import { HANDOFF_STATUS, HandoffStatus, SUBJECT } from '../common/statuses';
import { LookupService } from '../common/lookup.service';
import { ROLES } from '../integrations/users.client';
import { NotificationClient } from '../integrations/notification.client';
import { OpportunityClient } from '../integrations/opportunity.client';
import { HistoryService } from '../history/history.service';
import { ASSIGNMENT_EVENTS, AssignmentEventPublisher } from '../events/assignment-event.publisher';
import { CreateHandoffDto, ListHandoffsQueryDto, UpdateHandoffDto } from './handoffs.dto';

const { REQUESTED, ACCEPTED, RETURNED, COMPLETED, CANCELLED } = HANDOFF_STATUS;

/**
 * Sales → Pre-Sales/Solution handoff (PRD Step 5, US-2).
 *
 *   REQUESTED ──accept──▶ ACCEPTED ──complete──▶ COMPLETED
 *       │  ▲
 *  return  resubmit          (cancel: from REQUESTED / RETURNED / ACCEPTED)
 *       ▼  │
 *     RETURNED
 *
 * On accept (once an opportunity is linked) the Solutions owner becomes the opportunity's
 * Pre-Sales owner in the Opportunity Service and is added to its People.
 */
@Injectable()
export class HandoffsService {
  constructor(
    @InjectRepository(PresalesHandoff)
    private readonly repo: Repository<PresalesHandoff>,
    private readonly dataSource: DataSource,
    private readonly lookup: LookupService,
    private readonly notifications: NotificationClient,
    private readonly opportunities: OpportunityClient,
    private readonly history: HistoryService,
    private readonly events: AssignmentEventPublisher,
  ) {}

  // ================= Reads =================

  async list(q: ListHandoffsQueryDto) {
    const page = q.page ?? 1;
    const limit = q.limit ?? 50;
    const [items, total] = await this.repo.findAndCount({
      where: {
        ...(q.opportunityId ? { opportunityId: q.opportunityId.trim().toUpperCase() } : {}),
        ...(q.assigneeUserId != null ? { assigneeUserId: String(q.assigneeUserId) } : {}),
        ...(q.status ? { status: q.status as HandoffStatus } : {}),
      },
      order: { updatedAt: 'DESC', id: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    });
    return { items, total, page, limit };
  }

  async get(id: string): Promise<PresalesHandoff> {
    const h = await this.repo.findOneBy({ id });
    if (!h) throw new NotFoundException(`Handoff ${id} not found`);
    return h;
  }

  // ================= Actions =================

  async create(dto: CreateHandoffDto, actorUserId?: number) {
    const requester = actorUserId != null ? await this.lookup.activeUser(actorUserId, 'Requester') : null;
    const assignee = dto.assigneeUserId != null ? await this.presalesUser(dto.assigneeUserId) : null;
    const opportunityId = dto.opportunityId ? (await this.lookup.opportunity(dto.opportunityId)).publicId : null;

    const handoff = await this.dataSource.transaction(async (manager) => {
      const h = await manager.save(
        manager.create(PresalesHandoff, {
          title: dto.title.trim(),
          opportunityId,
          leadId: dto.leadId ?? null,
          synopsisId: dto.synopsisId ?? null,
          requestedSupport: dto.requestedSupport ?? null,
          dueDate: dto.dueDate ? dto.dueDate.slice(0, 10) : null,
          pendingInputs: dto.pendingInputs ?? null,
          status: REQUESTED,
          requestedByUserId: requester?.id ?? null,
          requestedByName: requester?.name ?? null,
          assigneeUserId: assignee?.id ?? null,
          assigneeName: assignee?.name ?? null,
        }),
      );
      await this.history.record(manager, {
        subjectType: SUBJECT.HANDOFF, subjectId: h.id, opportunityId: h.opportunityId,
        action: 'REQUESTED', toStatus: REQUESTED, actorUserId, snapshot: h,
      });
      await this.events.publish(manager, {
        eventType: ASSIGNMENT_EVENTS.HANDOFF_REQUESTED,
        subjectType: SUBJECT.HANDOFF, subjectId: h.id, opportunityId: h.opportunityId,
        data: { title: h.title, assigneeUserId: h.assigneeUserId, dueDate: h.dueDate },
      });
      return h;
    });

    if (assignee) {
      await this.notify(assignee.id, assignee.name, `New Pre-Sales request: ${handoff.title}`,
        `${requester?.name ?? 'Sales'} asked for Pre-Sales support${handoff.dueDate ? ` by ${handoff.dueDate}` : ''}.`, handoff);
    }
    return handoff;
  }

  /** Update details. Linking an opportunity to an already accepted handoff syncs its Pre-Sales owner. */
  async update(id: string, dto: UpdateHandoffDto, actorUserId?: number) {
    const before = await this.get(id);
    const opportunityId = dto.opportunityId
      ? (await this.lookup.opportunity(dto.opportunityId)).publicId
      : dto.opportunityId; // undefined = unchanged, null = unlink

    const saved = await this.dataSource.transaction(async (manager) => {
      const h = await manager.findOneByOrFail(PresalesHandoff, { id });
      if (dto.title !== undefined) h.title = dto.title.trim();
      if (opportunityId !== undefined) h.opportunityId = opportunityId;
      if (dto.requestedSupport !== undefined) h.requestedSupport = dto.requestedSupport;
      if (dto.dueDate !== undefined) h.dueDate = dto.dueDate ? dto.dueDate.slice(0, 10) : null;
      if (dto.pendingInputs !== undefined) h.pendingInputs = dto.pendingInputs;
      const s = await manager.save(h);
      await this.history.record(manager, {
        subjectType: SUBJECT.HANDOFF, subjectId: s.id, opportunityId: s.opportunityId,
        action: 'UPDATED', fromStatus: s.status, toStatus: s.status, actorUserId, snapshot: s,
      });
      return s;
    });

    const newlyLinked = saved.status === ACCEPTED && saved.opportunityId && saved.opportunityId !== before.opportunityId;
    const warnings = newlyLinked ? await this.syncOpportunity(saved, actorUserId) : [];
    return warnings.length ? { ...saved, warnings } : saved;
  }

  /** Pre-Sales Manager accepts and names the Solutions owner. */
  async accept(id: string, dto: { assigneeUserId?: number | null; opportunityId?: string | null }, actorUserId?: number) {
    const solutionManager = await this.lookup.requireRole(actorUserId, ROLES.SOLUTION_MANAGER, 'accept Pre-Sales handoffs');
    const current = await this.get(id);
    const assigneeId = dto.assigneeUserId ?? current.assigneeUserId;
    if (!assigneeId) throw new BadRequestException('assigneeUserId (the Solutions owner) is required to accept');
    const assignee = await this.presalesUser(assigneeId);
    const opportunityId = dto.opportunityId
      ? (await this.lookup.opportunity(dto.opportunityId)).publicId
      : current.opportunityId;

    const h = await this.transition(id, {
      from: [REQUESTED], to: ACCEPTED, action: 'ACCEPTED', actorUserId: solutionManager.id,
      event: ASSIGNMENT_EVENTS.HANDOFF_ACCEPTED,
      apply: (x) => Object.assign(x, {
        assigneeUserId: assignee.id, assigneeName: assignee.name, opportunityId, acceptedAt: new Date(),
      }),
    });

    await this.notify(assignee.id, assignee.name, `You are the Solutions owner for ${h.title}`,
      `${solutionManager.name} accepted the handoff and assigned it to you.`, h);
    if (h.requestedByUserId) {
      await this.notify(h.requestedByUserId, h.requestedByName, `Pre-Sales accepted: ${h.title}`,
        `Solutions owner: ${assignee.name}.`, h);
    }
    const warnings = h.opportunityId ? await this.syncOpportunity(h, solutionManager.id) : [];
    return warnings.length ? { ...h, warnings } : h;
  }

  /** Pre-Sales Manager returns it to Sales with questions. */
  async returnToSales(id: string, note: string, actorUserId?: number) {
    const solutionManager = await this.lookup.requireRole(actorUserId, ROLES.SOLUTION_MANAGER, 'return Pre-Sales handoffs');
    const h = await this.transition(id, {
      from: [REQUESTED], to: RETURNED, action: 'RETURNED', actorUserId: solutionManager.id, comment: note,
      event: ASSIGNMENT_EVENTS.HANDOFF_RETURNED,
      apply: (x) => { x.returnNote = note; },
    });
    if (h.requestedByUserId) {
      await this.notify(h.requestedByUserId, h.requestedByName, `Returned by Pre-Sales: ${h.title}`, note, h);
    }
    return h;
  }

  /** Sales answers the questions and sends it again. */
  resubmit(id: string, note: string | null | undefined, actorUserId?: number) {
    return this.transition(id, {
      from: [RETURNED], to: REQUESTED, action: 'RESUBMITTED', actorUserId, comment: note,
      event: ASSIGNMENT_EVENTS.HANDOFF_REQUESTED,
    });
  }

  complete(id: string, note: string | null | undefined, actorUserId?: number) {
    return this.transition(id, {
      from: [ACCEPTED], to: COMPLETED, action: 'COMPLETED', actorUserId, comment: note,
      event: ASSIGNMENT_EVENTS.HANDOFF_COMPLETED,
      apply: (x) => { x.completedAt = new Date(); },
    });
  }

  cancel(id: string, note: string | null | undefined, actorUserId?: number) {
    return this.transition(id, {
      from: [REQUESTED, RETURNED, ACCEPTED], to: CANCELLED, action: 'CANCELLED', actorUserId, comment: note,
    });
  }

  // ================= Helpers =================

  /** Locks the handoff, checks the allowed "from" statuses, applies the change, writes history + event. */
  private async transition(
    id: string,
    t: {
      from: HandoffStatus[];
      to: HandoffStatus;
      action: string;
      actorUserId?: number | string;
      comment?: string | null;
      event?: string;
      apply?: (h: PresalesHandoff) => void;
    },
  ): Promise<PresalesHandoff> {
    return this.dataSource.transaction(async (manager) => {
      const h = await manager.getRepository(PresalesHandoff).findOne({
        where: { id },
        lock: { mode: 'pessimistic_write' },
      });
      if (!h) throw new NotFoundException(`Handoff ${id} not found`);
      if (!t.from.includes(h.status)) {
        throw new BadRequestException(`Handoff is ${h.status}; this action needs ${t.from.join(' or ')}`);
      }
      const fromStatus = h.status;
      t.apply?.(h);
      h.status = t.to;
      const saved = await manager.save(h);

      await this.history.record(manager, {
        subjectType: SUBJECT.HANDOFF, subjectId: saved.id, opportunityId: saved.opportunityId,
        action: t.action, fromStatus, toStatus: t.to, actorUserId: t.actorUserId, comment: t.comment,
        snapshot: saved,
      });
      if (t.event) {
        await this.events.publish(manager, {
          eventType: t.event,
          subjectType: SUBJECT.HANDOFF, subjectId: saved.id, opportunityId: saved.opportunityId,
          data: { status: t.to, assigneeUserId: saved.assigneeUserId, comment: t.comment ?? null },
        });
      }
      return saved;
    });
  }

  /** The Solutions owner must be an active Pre-Sales user. */
  private async presalesUser(userId: number | string) {
    const user = await this.lookup.activeUser(userId, 'Pre-Sales owner');
    if (!user.roles.includes(ROLES.PRESALES)) {
      throw new BadRequestException(`${user.name} is not a Pre-Sales user`);
    }
    return user;
  }

  /** Makes the Solutions owner the opportunity's Pre-Sales owner and adds them to its People. */
  private async syncOpportunity(h: PresalesHandoff, actorUserId?: number | string): Promise<string[]> {
    if (!h.opportunityId || !h.assigneeUserId) return [];
    try {
      await this.opportunities.setPresalesOwner(h.opportunityId, { userId: h.assigneeUserId, name: h.assigneeName }, actorUserId);
      await this.opportunities.addDealTeamMember(h.opportunityId, { n: h.assigneeName ?? `User ${h.assigneeUserId}`, r: 'Pre-Sales' }, actorUserId);
      return [];
    } catch (err) {
      return [`Opportunity ${h.opportunityId} not updated: ${err instanceof Error ? err.message : err}`];
    }
  }

  private notify(toUserId: string, toName: string | null, title: string, message: string, h: PresalesHandoff) {
    return this.notifications.send({
      toUserId, toName, kind: 'HANDOFF', title, message,
      link: h.opportunityId ? `/opportunities/${h.opportunityId}` : '/rfp',
    });
  }
}
