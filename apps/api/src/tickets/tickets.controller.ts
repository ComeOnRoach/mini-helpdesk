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
  Res,
  StreamableFile,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiHeader,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { contentDisposition } from '../common/content-disposition';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { User } from '../users/user.entity';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ExportTicketsQueryDto } from './dto/export-tickets-query.dto';
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
  @ApiResponse({
    status: 500,
    description: 'Simulated failure, only when FLAKY_RATE > 0',
    type: ErrorResponseDto,
  })
  @ApiHeader({
    name: 'x-delay-ms',
    required: false,
    description:
      'One-off delay in ms (max 10000) replacing SLOW_API_MS; honoured only when NODE_ENV=test or ENABLE_TEST_API=true',
  })
  list(
    @CurrentUser() user: User,
    @Query() query: ListTicketsQueryDto,
  ): Promise<TicketListResponseDto> {
    return this.tickets.list(user, query);
  }

  // Declared before :id, otherwise "export" would be read as a ticket id.
  @Get('export')
  @ApiOperation({
    summary: 'Export tickets as CSV',
    description:
      'Same filters and sort as the list, without paging. Columns: id, title, status, priority, tags (joined with ";"), createdBy (email), createdAt. ' +
      'UTF-8 with BOM so Excel opens it correctly. An agent exports all tickets, a user only their own.',
  })
  @ApiResponse({
    status: 200,
    description: 'CSV file, tickets-YYYY-MM-DD.csv',
    content: { 'text/csv': { schema: { type: 'string' } } },
  })
  @ApiResponse({ status: 400, description: 'Invalid query parameter', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  async export(
    @CurrentUser() user: User,
    @Query() query: ExportTicketsQueryDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    const csv = await this.tickets.exportCsv(user, query);
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return new StreamableFile(Buffer.from(csv, 'utf8'), {
      type: 'text/csv; charset=utf-8',
      disposition: contentDisposition(`tickets-${new Date().toISOString().slice(0, 10)}.csv`),
    });
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
