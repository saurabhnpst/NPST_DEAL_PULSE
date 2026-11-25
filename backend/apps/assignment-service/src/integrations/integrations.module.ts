import { Global, Module } from '@nestjs/common';
import { HttpUsersClient, MockUsersClient, UsersClient } from './users.client';
import {
  HttpNotificationClient,
  MockNotificationClient,
  NotificationClient,
} from './notification.client';
import { HttpRfpClient, MockRfpClient, RfpClient } from './rfp.client';
import {
  HttpOpportunityClient,
  MockOpportunityClient,
  OpportunityClient,
} from './opportunity.client';

/**
 * Picks the real client when the service URL is set, otherwise the mock.
 * Switching to a real service = set one env variable. No code change.
 *
 *   AUTH_SERVICE_URL          → users and roles
 *   NOTIFICATION_SERVICE_URL  → Teams / email / in-app notifications
 *   RFP_SERVICE_URL           → confirmed RFP requirements
 *   OPPORTUNITY_SERVICE_URL   → opportunity lookup + Pre-Sales owner / People sync
 */
const url = (name: string) => process.env[name]?.trim() || undefined;

@Global()
@Module({
  providers: [
    {
      provide: UsersClient,
      useFactory: () => {
        const base = url('AUTH_SERVICE_URL');
        return base ? new HttpUsersClient(base) : new MockUsersClient();
      },
    },
    {
      provide: NotificationClient,
      useFactory: () => {
        const base = url('NOTIFICATION_SERVICE_URL');
        return base ? new HttpNotificationClient(base) : new MockNotificationClient();
      },
    },
    {
      provide: RfpClient,
      useFactory: () => {
        const base = url('RFP_SERVICE_URL');
        return base ? new HttpRfpClient(base) : new MockRfpClient();
      },
    },
    {
      provide: OpportunityClient,
      useFactory: () => {
        const base = url('OPPORTUNITY_SERVICE_URL');
        return base ? new HttpOpportunityClient(base) : new MockOpportunityClient();
      },
    },
  ],
  exports: [UsersClient, NotificationClient, RfpClient, OpportunityClient],
})
export class IntegrationsModule {}
