import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Attachment } from '../attachments/attachment.entity';
import { FileStorageService } from '../storage/file-storage.service';
import { TicketPriority, TicketStatus, UserRole } from '../common/enums';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { toCsv } from '../common/csv';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { ExportTicketsQueryDto } from './dto/export-tickets-query.dto';
import { TicketDetailResponseDto } from './dto/ticket-detail-response.dto';
import { UpdateTicketDto } from './dto/update-ticket.dto';
import { canAccessTicket, canDeleteTicket } from './ticket-access';
import {
  TICKET_CREATED,
  TICKET_UPDATED,
  TicketCreatedEvent,
  TicketUpdatedEvent,
} from './events/ticket-events';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  ListTicketsQueryDto,
  SortField,
} from './dto/list-tickets-query.dto';
import { TicketListResponseDto, TicketResponseDto } from './dto/ticket-response.dto';
import { Ticket } from './ticket.entity';

// Escape LIKE wildcards so "100%" or "a_b" are searched literally.
function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

@Injectable()
export class TicketsService {
  constructor(
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    @InjectRepository(Attachment) private readonly attachments: Repository<Attachment>,
    private readonly users: UsersService,
    private readonly storage: FileStorageService,
    private readonly events: EventEmitter2,
  ) {}

  // Shared by the list and the CSV export, so both always return the same tickets.
  private filteredQuery(
    user: User,
    query: Omit<ListTicketsQueryDto, 'page' | 'limit'>,
  ): SelectQueryBuilder<Ticket> {
    // Defaults are applied here because an empty query value ("?sort=") arrives as undefined.
    const { status, priority, tag, q } = query;
    const [field, direction] = (query.sort ?? DEFAULT_SORT).split(':') as [
      SortField,
      'asc' | 'desc',
    ];

    const qb = this.tickets.createQueryBuilder('ticket');

    // A user only ever sees their own tickets; no query parameter can widen this.
    if (user.role !== UserRole.Agent) {
      qb.andWhere('ticket.createdById = :userId', { userId: user.id });
    }
    if (status) {
      qb.andWhere('ticket.status = :status', { status });
    }
    if (priority) {
      qb.andWhere('ticket.priority = :priority', { priority });
    }
    if (tag) {
      qb.andWhere('JSON_CONTAINS(ticket.tags, :tag)', { tag: JSON.stringify(tag) });
    }
    if (q) {
      qb.andWhere(
        "(ticket.title LIKE :q ESCAPE '\\\\' OR ticket.description LIKE :q ESCAPE '\\\\')",
        { q: likePattern(q) },
      );
    }

    // The id tiebreaker keeps page boundaries stable when sort values repeat.
    qb.orderBy(`ticket.${field}`, direction.toUpperCase() as 'ASC' | 'DESC');
    if (field !== 'id') {
      qb.addOrderBy('ticket.id', 'DESC');
    }
    return qb;
  }

  async list(user: User, query: ListTicketsQueryDto): Promise<TicketListResponseDto> {
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const [items, total] = await this.filteredQuery(user, query)
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }

  // All tickets matching the filters (no paging), as CSV text.
  async exportCsv(user: User, query: ExportTicketsQueryDto): Promise<string> {
    const tickets = await this.filteredQuery(user, query)
      .leftJoinAndSelect('ticket.createdBy', 'creator')
      .getMany();
    return toCsv(
      ['id', 'title', 'status', 'priority', 'tags', 'createdBy', 'createdAt'],
      tickets.map((ticket) => [
        ticket.id,
        ticket.title,
        ticket.status,
        ticket.priority,
        ticket.tags.join(';'),
        ticket.createdBy.email,
        ticket.createdAt.toISOString(),
      ]),
    );
  }

  async create(user: User, dto: CreateTicketDto): Promise<TicketResponseDto> {
    const ticket = await this.tickets.save(
      this.tickets.create({
        title: dto.title,
        description: dto.description,
        priority: dto.priority ?? TicketPriority.Medium,
        tags: dto.tags ?? [],
        status: TicketStatus.Open,
        createdById: user.id,
        assigneeId: null,
      }),
    );
    const event: TicketCreatedEvent = { ticket };
    this.events.emit(TICKET_CREATED, event);
    return ticket;
  }

  async findOne(user: User, id: number): Promise<TicketDetailResponseDto> {
    const ticket = await this.tickets.findOne({
      where: { id },
      relations: { comments: true, attachments: true },
      order: {
        comments: { createdAt: 'ASC', id: 'ASC' },
        attachments: { createdAt: 'ASC', id: 'ASC' },
      },
    });
    this.assertVisible(user, ticket);
    return {
      ...ticket,
      comments: ticket.comments.map((c) => ({
        id: c.id,
        ticketId: c.ticketId,
        authorId: c.authorId,
        body: c.body,
        createdAt: c.createdAt,
      })),
      // The server-side file path is internal and not returned.
      attachments: ticket.attachments.map((a) => ({
        id: a.id,
        filename: a.filename,
        mime: a.mime,
        size: a.size,
        createdAt: a.createdAt,
      })),
    };
  }

  async update(user: User, id: number, dto: UpdateTicketDto): Promise<TicketResponseDto> {
    const ticket = await this.tickets.findOneBy({ id });
    this.assertVisible(user, ticket);

    const changesAgentFields = dto.status !== undefined || dto.assigneeId !== undefined;
    if (changesAgentFields && user.role !== UserRole.Agent) {
      throw new ForbiddenException('Only agents can change status or assignee');
    }
    if (Object.values(dto).every((value) => value === undefined)) {
      throw new BadRequestException('Send at least one field to update');
    }
    if (dto.assigneeId !== undefined && dto.assigneeId !== null) {
      const assignee = await this.users.findById(dto.assigneeId);
      if (assignee?.role !== UserRole.Agent) {
        throw new BadRequestException('assigneeId must be the id of an agent');
      }
    }

    Object.assign(ticket, dto);
    await this.tickets.save(ticket);
    const updated = await this.tickets.findOneByOrFail({ id });

    const event: TicketUpdatedEvent = {
      ticket: updated,
      changedFields: Object.keys(dto).filter(
        (key) => dto[key as keyof UpdateTicketDto] !== undefined,
      ),
      actorId: user.id,
    };
    this.events.emit(TICKET_UPDATED, event);
    return updated;
  }

  async remove(user: User, id: number): Promise<void> {
    const ticket = await this.tickets.findOneBy({ id });
    this.assertVisible(user, ticket);
    if (!canDeleteTicket(user, ticket)) {
      throw new ForbiddenException('Only agents can delete a ticket that is not open');
    }
    const files = await this.attachments.find({ where: { ticketId: id }, select: { path: true } });
    // Comments and attachment rows go with it (ON DELETE CASCADE); the files are removed here.
    await this.tickets.delete({ id });
    await this.storage.removeMany(files.map((file) => file.path));
  }

  // Used by other modules (comments) that must apply the same access rule.
  async findVisibleOrFail(user: User, id: number): Promise<Ticket> {
    const ticket = await this.tickets.findOneBy({ id });
    this.assertVisible(user, ticket);
    return ticket;
  }

  // A ticket created by someone else answers 404, like a missing one, so its id is not revealed.
  private assertVisible(user: User, ticket: Ticket | null): asserts ticket is Ticket {
    if (!ticket || !canAccessTicket(user, ticket)) {
      throw new NotFoundException('Ticket not found');
    }
  }
}
