import {
  Controller,
  Get,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Public } from '../../../libs/command-module-auth/src';
import { ApiOkResponse, ApiOperation, ApiServiceUnavailableResponse, ApiTags } from '@nestjs/swagger';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import {
  HealthLiveResponseDto,
  HealthReadyResponseDto,
} from './dto/health-response.dto';

@ApiTags('Health')
@Controller('health')
export class HealthController {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness probe' })
  @ApiOkResponse({ type: HealthLiveResponseDto })
  live(): HealthLiveResponseDto {
    return {
      service: 'rfp-service',
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('ready')
  @ApiOperation({ summary: 'Readiness probe (MySQL connectivity)' })
  @ApiOkResponse({ type: HealthReadyResponseDto })
  @ApiServiceUnavailableResponse({ description: 'Database unreachable' })
  async ready(): Promise<HealthReadyResponseDto> {
    try {
      await this.dataSource.query('SELECT 1');
      const rows = await this.dataSource.query(
        'SELECT DATABASE() AS db_name',
      );
      return {
        service: 'rfp-service',
        status: 'ready',
        database: 'up',
        dbName: rows[0]?.db_name ?? null,
        timestamp: new Date().toISOString(),
      };
    } catch {
      throw new ServiceUnavailableException({
        service: 'rfp-service',
        status: 'not_ready',
        database: 'down',
        timestamp: new Date().toISOString(),
      });
    }
  }
}