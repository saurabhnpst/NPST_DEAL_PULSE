import { Controller, Get } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Controller('health')
export class HealthController {
  constructor(private readonly dataSource: DataSource) {}

  @Get()
  async check() {
    const timestamp = new Date().toISOString();
    const base = {
      service: 'opportunity-service',
      timestamp,
    };
    try {
      await this.dataSource.query('SELECT 1 AS ok');
      return {
        ...base,
        status: 'ok',
        database: 'connected',
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Database unreachable';
      return {
        ...base,
        status: 'degraded',
        database: 'disconnected',
        error: message,
      };
    }
  }
}