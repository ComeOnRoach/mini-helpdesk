import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TicketPriority, TicketStatus, UserRole } from '../common/enums';
import { Ticket } from '../tickets/ticket.entity';
import { User } from '../users/user.entity';
import { StatsResponseDto } from './dto/stats-response.dto';

interface GroupRow {
  status: TicketStatus;
  priority: TicketPriority;
  count: string;
}

@Injectable()
export class StatsService {
  constructor(@InjectRepository(Ticket) private readonly tickets: Repository<Ticket>) {}

  // Counts the tickets the caller can see: an agent all of them, a user only their own.
  async getStats(user: User): Promise<StatsResponseDto> {
    const qb = this.tickets
      .createQueryBuilder('ticket')
      .select('ticket.status', 'status')
      .addSelect('ticket.priority', 'priority')
      .addSelect('COUNT(*)', 'count')
      .groupBy('ticket.status')
      .addGroupBy('ticket.priority');
    if (user.role !== UserRole.Agent) {
      qb.where('ticket.createdById = :userId', { userId: user.id });
    }
    const rows = await qb.getRawMany<GroupRow>();

    // Groups with no tickets are absent from the rows, so every counter starts at 0.
    const stats: StatsResponseDto = {
      total: 0,
      open: 0,
      in_progress: 0,
      closed: 0,
      byPriority: { low: 0, medium: 0, high: 0 },
    };
    for (const row of rows) {
      const count = Number(row.count);
      stats.total += count;
      stats[row.status] += count;
      stats.byPriority[row.priority] += count;
    }
    return stats;
  }
}
