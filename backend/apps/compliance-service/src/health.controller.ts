import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheckResponseDto } from './dto/health-check-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({
    summary: 'Health check',
    description:
      'Returns service identity and current status. Does not verify database connectivity.',
  })
  @ApiResponse({ status: 200, type: HealthCheckResponseDto })
  check(): HealthCheckResponseDto {
    return {
      service: 'compliance-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }
}