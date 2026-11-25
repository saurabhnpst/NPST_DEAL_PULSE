import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';
import {
  DomainEventEnvelope,
  OPPORTUNITY_EVENT_TYPES,
  buildEventEnvelope,
} from './domain-event';
import { OpportunityDomainEvent } from '../entities/opportunity-domain-event.entity';

@Injectable()
export class OpportunityEventPublisher {
  private readonly logger = new Logger(OpportunityEventPublisher.name);

  constructor(private readonly dataSource: DataSource) {}

  async publishInTransaction(
    manager: import('typeorm').EntityManager,
    eventType: string,
    opportunityId: string,
    payload: Record<string, unknown>,
    correlationId?: string,
  ): Promise<DomainEventEnvelope<Record<string, unknown>>> {
    const envelope = buildEventEnvelope(eventType, {
      opportunityId,
      ...payload,
    }, correlationId);

    const row = manager.create(OpportunityDomainEvent, {
      opportunityId,
      eventType: envelope.eventType,
      schemaVersion: envelope.schemaVersion,
      payload: envelope,
      correlationId: envelope.correlationId ?? null,
      occurredAt: new Date(envelope.occurredAt),
      publishedAt: null,
    });
    await manager.save(row);
    this.logger.debug(`Outbox event ${envelope.eventType} for opportunity ${opportunityId}`);
    return envelope;
  }

  async publish(
    opportunityId: string,
    eventType: keyof typeof OPPORTUNITY_EVENT_TYPES | string,
    payload: Record<string, unknown>,
    correlationId?: string,
  ): Promise<DomainEventEnvelope<Record<string, unknown>>> {
    return this.dataSource.transaction((manager) =>
      this.publishInTransaction(manager, eventType, opportunityId, payload, correlationId),
    );
  }
}