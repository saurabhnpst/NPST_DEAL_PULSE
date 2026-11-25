import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { AssignmentHistory } from '../entities';
import { Subject } from '../common/statuses';

export type HistoryEntry = {
  subjectType: Subject;
  subjectId: string;
  opportunityId?: string | null;
  action: string;
  fromStatus?: string | null;
  toStatus?: string | null;
  actorUserId?: number | string | null;
  comment?: string | null;
  /** The record after the change. */
  snapshot?: object | null;
};

/** Append-only audit trail shared by assignments, requirements, handoffs and the master data. */
@Injectable()
export class HistoryService {
  constructor(
    @InjectRepository(AssignmentHistory)
    private readonly repo: Repository<AssignmentHistory>,
  ) {}

  /** Call inside the same transaction as the change. */
  async record(manager: EntityManager, entry: HistoryEntry): Promise<void> {
    await manager.save(
      manager.create(AssignmentHistory, {
        subjectType: entry.subjectType,
        subjectId: entry.subjectId,
        opportunityId: entry.opportunityId ?? null,
        action: entry.action,
        fromStatus: entry.fromStatus ?? null,
        toStatus: entry.toStatus ?? null,
        actorUserId: entry.actorUserId != null ? String(entry.actorUserId) : null,
        comment: entry.comment ?? null,
        snapshot: entry.snapshot ? JSON.parse(JSON.stringify(entry.snapshot)) : null,
      }),
    );
  }

  /** Newest first. */
  list(subjectType: Subject, subjectId: string): Promise<AssignmentHistory[]> {
    return this.repo.find({
      where: { subjectType, subjectId },
      order: { createdAt: 'DESC', id: 'DESC' },
    });
  }
}
