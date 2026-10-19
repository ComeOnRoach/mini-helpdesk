import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserRole } from '../common/enums';
import { User } from '../users/user.entity';
import {
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT,
  ListTicketsQueryDto,
  SortField,
} from './dto/list-tickets-query.dto';
import { TicketListResponseDto } from './dto/ticket-response.dto';
import { Ticket } from './ticket.entity';

// Escape LIKE wildcards so "100%" or "a_b" are searched literally.
function likePattern(text: string): string {
  return `%${text.replace(/[\\%_]/g, '\\$&')}%`;
}

@Injectable()
export class TicketsService {
  constructor(@InjectRepository(Ticket) private readonly tickets: Repository<Ticket>) {}

  async list(user: User, query: ListTicketsQueryDto): Promise<TicketListResponseDto> {
    // Defaults are applied here because an empty query value ("?page=") arrives as undefined.
    const { status, priority, tag, q } = query;
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;
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

    const [items, total] = await qb
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return { items, total, page, limit };
  }
}
