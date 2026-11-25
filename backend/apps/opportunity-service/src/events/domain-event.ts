export type DomainEventEnvelope<T extends Record<string, unknown>> = {
  eventId: string;
  eventType: string;
  schemaVersion: number;
  occurredAt: string;
  producer: string;
  correlationId?: string;
  payload: T;
};

export const OPPORTUNITY_EVENT_TYPES = {
  CREATED: 'OpportunityCreated',
  UPDATED: 'OpportunityUpdated',
  STAGE_CHANGED: 'OpportunityStageChanged',
  COMMERCIAL_REVISED: 'OpportunityCommercialRevised',
  PO_RECEIVED: 'OpportunityPoReceived',
  ACTIVITY_LOGGED: 'OpportunityActivityLogged',
  DELETED: 'OpportunityDeleted',
} as const;

export function buildEventEnvelope<T extends Record<string, unknown>>(
  eventType: string,
  payload: T,
  correlationId?: string,
): DomainEventEnvelope<T> {
  return {
    eventId: `evt_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`,
    eventType,
    schemaVersion: 1,
    occurredAt: new Date().toISOString(),
    producer: 'opportunity-service',
    correlationId,
    payload,
  };
}