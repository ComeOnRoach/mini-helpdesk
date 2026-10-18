import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { Repository } from 'typeorm';
import { Comment } from '../comments/comment.entity';
import { Ticket } from '../tickets/ticket.entity';
import { User } from '../users/user.entity';
import { SEED_COMMENTS, SEED_TICKETS, SEED_USERS, seedDate } from './seed.data';

const BCRYPT_COST = 10;

export interface SeedSummary {
  users: number;
  tickets: number;
  comments: number;
}

// Insert-if-missing by natural key (user email, ticket title, comment ticket + body).
// Running it again creates nothing and never overwrites existing rows.
// Reused by the test API (T7.3).
@Injectable()
export class SeedService {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
  ) {}

  async run(): Promise<SeedSummary> {
    const summary: SeedSummary = { users: 0, tickets: 0, comments: 0 };
    const userIds = new Map<string, number>();

    for (const seedUser of SEED_USERS) {
      let user = await this.users.findOneBy({ email: seedUser.email });
      if (!user) {
        user = await this.users.save(
          this.users.create({
            email: seedUser.email,
            passwordHash: await hash(seedUser.password, BCRYPT_COST),
            role: seedUser.role,
            createdAt: seedDate(-1),
          }),
        );
        summary.users++;
      }
      userIds.set(seedUser.email, user.id);
    }

    const ticketIds = new Map<string, number>();
    for (const seedTicket of SEED_TICKETS) {
      let ticket = await this.tickets.findOneBy({ title: seedTicket.title });
      if (!ticket) {
        ticket = await this.tickets.save(
          this.tickets.create({
            title: seedTicket.title,
            description: seedTicket.description,
            status: seedTicket.status,
            priority: seedTicket.priority,
            tags: seedTicket.tags,
            createdById: this.idOf(userIds, seedTicket.createdBy),
            assigneeId: seedTicket.assignee ? this.idOf(userIds, seedTicket.assignee) : null,
            createdAt: seedDate(seedTicket.day),
            updatedAt: seedDate(seedTicket.day),
          }),
        );
        summary.tickets++;
      }
      ticketIds.set(seedTicket.title, ticket.id);
    }

    for (const seedComment of SEED_COMMENTS) {
      const ticketId = this.idOf(ticketIds, seedComment.ticket);
      const exists = await this.comments.existsBy({ ticketId, body: seedComment.body });
      if (!exists) {
        await this.comments.save(
          this.comments.create({
            ticketId,
            authorId: this.idOf(userIds, seedComment.author),
            body: seedComment.body,
            createdAt: seedDate(seedComment.day),
          }),
        );
        summary.comments++;
      }
    }

    this.logger.log(
      `Created ${summary.users} users, ${summary.tickets} tickets, ${summary.comments} comments`,
    );
    return summary;
  }

  private idOf(ids: Map<string, number>, key: string): number {
    const id = ids.get(key);
    if (id === undefined) {
      throw new Error(`Seed data references an unknown entry: ${key}`);
    }
    return id;
  }
}
