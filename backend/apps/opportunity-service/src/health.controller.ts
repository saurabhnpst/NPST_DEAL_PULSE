import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../libs/command-module-auth/src';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  check() {
    return {
      service: 'opportunity-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
