export const APPROVAL_EVENTS = Symbol('APPROVAL_EVENTS');

export interface ApprovalEvent {
  eventId: string;
  eventType: string;
  schemaVersion: string;
  occurredAt: string;
  producer: string;
  correlationId: string;
  payload: Record<string, string>;
}

export interface ApprovalEventPublisher {
  publish(event: ApprovalEvent): Promise<void>;
}

export class InMemoryApprovalEventPublisher implements ApprovalEventPublisher {
  readonly events: ApprovalEvent[] = [];

  async publish(event: ApprovalEvent): Promise<void> {
    this.events.push(event);
  }
}
