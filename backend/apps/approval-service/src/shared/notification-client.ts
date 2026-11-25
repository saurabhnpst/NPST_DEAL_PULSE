export interface PendingNotificationEnqueue {
  entityId: string;
  eventType: string;
  assigneeId: string;
  correlationId?: string;
}

export interface NotificationClient {
  enqueuePending(request: PendingNotificationEnqueue): Promise<void>;
}

export class NoopNotificationClient implements NotificationClient {
  async enqueuePending(_request: PendingNotificationEnqueue): Promise<void> {
    return;
  }
}