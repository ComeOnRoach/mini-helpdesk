import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { HealthResponseDto } from './health-response.dto';

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly health: HealthCheckService,
    private readonly db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  @ApiOperation({ summary: 'API and database health' })
  @ApiResponse({ status: 200, description: 'API and database are up', type: HealthResponseDto })
  @ApiResponse({ status: 503, description: 'Database is down', type: HealthResponseDto })
  async check(): Promise<HealthResponseDto> {
    try {
      await this.health.check([() => this.db.pingCheck('db').withTimeout(3000)]);
    } catch {
      throw new ServiceUnavailableException({ status: 'error', db: 'down' });
    }
    return { status: 'ok', db: 'up' };
  }
}
