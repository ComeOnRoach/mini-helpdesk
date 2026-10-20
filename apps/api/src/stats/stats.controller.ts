import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { User } from '../users/user.entity';
import { StatsResponseDto } from './dto/stats-response.dto';
import { StatsService } from './stats.service';

@ApiTags('stats')
@ApiBearerAuth()
@Controller('stats')
export class StatsController {
  constructor(private readonly stats: StatsService) {}

  @Get()
  @ApiOperation({
    summary: 'Ticket counters',
    description:
      'Counts by status and by priority. An agent gets the numbers for all tickets, a user only for their own. ' +
      'Without filters, total equals the total of GET /api/tickets.',
  })
  @ApiResponse({ status: 200, description: 'The counters', type: StatsResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired token',
    type: ErrorResponseDto,
  })
  getStats(@CurrentUser() user: User): Promise<StatsResponseDto> {
    return this.stats.getStats(user);
  }
}
