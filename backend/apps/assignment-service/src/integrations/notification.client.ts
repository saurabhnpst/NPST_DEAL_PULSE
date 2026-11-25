import { Logger } from '@nestjs/common';
import { callService } from './http-call';

/**
 * Notifications (Teams / email / in-app) via the Notification Service.
 * Real:  NOTIFICATION_SERVICE_URL set → POST {NOTIFICATION_SERVICE_URL}/api/v1/notifications
 * Mock:  otherwise → logged and kept in memory (`sent`), handy in tests.
 *
 * Sending never throws: a failed notification must not undo an approval.
 * The reliable record is the outbox event, which is written in the same transaction.
 */

export type NotificationMessage = {
  toUserId: string | null;
  toName?: string | null;
  /** e.g. TECHNICAL_ASSIGNMENT, HANDOFF */
  kind: string;
  title: string;
  message: string;
  /** Frontend link, e.g. /opportunities/OPP-2026-00001 */
  link?: string;
};

export abstract class NotificationClient {
  abstract readonly mode: 'mock' | 'real';
  /** true = delivered (or logged, in mock mode). */
  abstract send(message: NotificationMessage): Promise<boolean>;
}

export class MockNotificationClient extends NotificationClient {
  readonly mode = 'mock' as const;
  readonly sent: NotificationMessage[] = [];
  private readonly logger = new Logger('MockNotification');

  async send(message: NotificationMessage): Promise<boolean> {
    this.sent.push(message);
    this.logger.log(`→ ${message.toName ?? message.toUserId}: ${message.title}`);
    return true;
  }
}

export class HttpNotificationClient extends NotificationClient {
  readonly mode = 'real' as const;
  private readonly logger = new Logger('NotificationClient');

  constructor(private readonly baseUrl: string) {
    super();
  }

  async send(message: NotificationMessage): Promise<boolean> {
    try {
      await callService('Notification Service', this.baseUrl, '/api/v1/notifications', {
        method: 'POST',
        body: message,
      });
      return true;
    } catch (err) {
      this.logger.warn(`Notification not sent: ${err instanceof Error ? err.message : err}`);
      return false;
    }
  }
}
