import { Controller, Get, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { User } from '../users/user.entity';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { TicketListResponseDto } from './dto/ticket-response.dto';
import { TicketsService } from './tickets.service';

@ApiTags('tickets')
@ApiBearerAuth()
@Controller('tickets')
export class TicketsController {
  constructor(private readonly tickets: TicketsService) {}

  @Get()
  @ApiOperation({
    summary: 'List tickets',
    description:
      'Paginated, filterable list. An agent sees all tickets, a user only their own. Filters combine with AND.',
  })
  @ApiResponse({ status: 200, description: 'A page of tickets', type: TicketListResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid query parameter', type: ErrorResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired token',
    type: ErrorResponseDto,
  })
  list(
    @CurrentUser() user: User,
    @Query() query: ListTicketsQueryDto,
  ): Promise<TicketListResponseDto> {
    return this.tickets.list(user, query);
  }
}
