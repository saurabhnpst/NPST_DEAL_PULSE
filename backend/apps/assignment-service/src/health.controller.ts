import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { UsersClient } from './integrations/users.client';
import { NotificationClient } from './integrations/notification.client';
import { RfpClient } from './integrations/rfp.client';
import { OpportunityClient } from './integrations/opportunity.client';

@Controller('health')
export class HealthController {
  constructor(
    private readonly dataSource: DataSource,
    private readonly users: UsersClient,
    private readonly notifications: NotificationClient,
    private readonly rfp: RfpClient,
    private readonly opportunities: OpportunityClient,
  ) {}

  /** Service + database status, and whether each dependency is the real service or a mock. */
  @Get()
  async check() {
    let database = 'connected';
    let error: string | undefined;
    try {
      await this.dataSource.query('SELECT 1');
    } catch (err) {
      database = 'disconnected';
      error = err instanceof Error ? err.message : 'Database unreachable';
    }
    return {
      service: 'assignment-service',
      status: database === 'connected' ? 'ok' : 'degraded',
      database,
      ...(error ? { error } : {}),
      integrations: {
        auth: this.users.mode,
        notification: this.notifications.mode,
        rfp: this.rfp.mode,
        opportunity: this.opportunities.mode,
      },
      timestamp: new Date().toISOString(),
    };
  }
}
