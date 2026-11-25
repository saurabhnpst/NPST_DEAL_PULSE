import { randomUUID } from 'crypto';
import { Injectable } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { AssignmentDomainEvent } from '../entities';
import { Subject } from '../common/statuses';

/** Events this service publishes (names agreed in docs/api/api-catalog.md where they exist). */
export const ASSIGNMENT_EVENTS = {
  REQUIREMENTS_RECEIVED: 'RfpRequirementsReceived',
  TECH_ASSIGNMENT_PROPOSED: 'TechnicalAssignmentProposed',
  /** Approved by the Solution Manager (catalog name). Notification Service informs the Tech Lead. */
  TECH_ASSIGNMENT_CREATED: 'TechnicalAssignmentCreated',
  TECH_ASSIGNMENT_RETURNED: 'TechnicalAssignmentReturned',
  HANDOFF_REQUESTED: 'PresalesHandoffRequested',
  HANDOFF_ACCEPTED: 'PresalesHandoffAccepted',
  HANDOFF_RETURNED: 'PresalesHandoffReturned',
  HANDOFF_COMPLETED: 'PresalesHandoffCompleted',
} as const;

type NewEvent = {
  eventType: string;
  subjectType: Subject;
  subjectId: string;
  opportunityId?: string | null;
  data?: Record<string, unknown>;
};

/**
 * Writes an event to the outbox table inside the caller's transaction,
 * so the event exists only if the change itself was saved.
 */
@Injectable()
export class AssignmentEventPublisher {
  async publish(manager: EntityManager, event: NewEvent): Promise<void> {
    const occurredAt = new Date();
    await manager.save(
      manager.create(AssignmentDomainEvent, {
        eventType: event.eventType,
        subjectType: event.subjectType,
        subjectId: event.subjectId,
        opportunityId: event.opportunityId ?? null,
        occurredAt,
        publishedAt: null,
        payload: {
          eventId: randomUUID(),
          eventType: event.eventType,
          schemaVersion: 1,
          occurredAt: occurredAt.toISOString(),
          producer: 'assignment-service',
          payload: {
            subjectType: event.subjectType,
            subjectId: event.subjectId,
            opportunityId: event.opportunityId ?? null,
            ...event.data,
          },
        },
      }),
    );
  }
}
