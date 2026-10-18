import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';
import { Public } from '../common/decorators/public.decorator';
import { HealthUnavailableException } from '../common/all-exceptions.filter';
import { HealthResponseDto } from './health-response.dto';

@Public()
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
      throw new HealthUnavailableException({ status: 'error', db: 'down' });
    }
    return { status: 'ok', db: 'up' };
  }
}
