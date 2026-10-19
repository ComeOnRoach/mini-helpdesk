import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { User } from '../users/user.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ListTicketsQueryDto } from './dto/list-tickets-query.dto';
import { TicketDetailResponseDto } from './dto/ticket-detail-response.dto';
import { TicketListResponseDto, TicketResponseDto } from './dto/ticket-response.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { TicketsService } from './tickets.service';

const UNAUTHORIZED = {
  status: 401,
  description: 'Missing, invalid or expired token',
  type: ErrorResponseDto,
};

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
  @ApiResponse(UNAUTHORIZED)
  list(
    @CurrentUser() user: User,
    @Query() query: ListTicketsQueryDto,
  ): Promise<TicketListResponseDto> {
    return this.tickets.list(user, query);
  }

  @Post()
  @ApiOperation({
    summary: 'Create a ticket',
    description: 'The ticket starts as open, is created by the current user and has no assignee.',
  })
  @ApiResponse({ status: 201, description: 'Ticket created', type: TicketResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid body', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  create(@CurrentUser() user: User, @Body() dto: CreateTicketDto): Promise<TicketResponseDto> {
    return this.tickets.create(user, dto);
  }

  @Get(':id')
  @ApiOperation({
    summary: 'Get a ticket with its comments and attachments',
    description: 'A user gets 404 for tickets created by someone else.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'The ticket', type: TicketDetailResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid id', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  @ApiResponse({ status: 404, description: 'Ticket not found', type: ErrorResponseDto })
  findOne(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<TicketDetailResponseDto> {
    return this.tickets.findOne(user, id);
  }

  @Patch(':id')
  @ApiOperation({
    summary: 'Update a ticket',
    description:
      'Send any of title, description, priority, tags. Only an agent may send status or assigneeId.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 200, description: 'The updated ticket', type: TicketResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid body or id', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  @ApiResponse({
    status: 403,
    description: 'A user tried to change status or assignee',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found', type: ErrorResponseDto })
  update(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateTicketDto,
  ): Promise<TicketResponseDto> {
    return this.tickets.update(user, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a ticket',
    description: 'An agent can delete any ticket; the author only while it is open.',
  })
  @ApiParam({ name: 'id', example: 1 })
  @ApiResponse({ status: 204, description: 'Ticket deleted' })
  @ApiResponse({ status: 400, description: 'Invalid id', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  @ApiResponse({
    status: 403,
    description: 'The author tried to delete a ticket that is not open',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Ticket not found', type: ErrorResponseDto })
  remove(@CurrentUser() user: User, @Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.tickets.remove(user, id);
  }
}
