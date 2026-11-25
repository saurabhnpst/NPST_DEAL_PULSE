import { Controller, Get } from '@nestjs/common';
import { Public } from '../../../libs/command-module-auth/src';

@Public()
@Controller('api/v1/health')
export class HealthController {
  @Get()
  check() {
    return {
      service: 'auth-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}
