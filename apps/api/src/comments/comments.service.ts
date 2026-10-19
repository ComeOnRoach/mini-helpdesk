import { Injectable } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { DEFAULT_LIMIT, DEFAULT_PAGE } from '../tickets/dto/list-tickets-query.dto';
import { TicketsService } from '../tickets/tickets.service';
import { User } from '../users/user.entity';
import { Comment } from './comment.entity';
import {
  CommentListResponseDto,
  CommentResponseDto,
  toCommentResponse,
} from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';
import { ListCommentsQueryDto } from './dto/list-comments-query.dto';
import { COMMENT_ADDED, CommentAddedEvent } from './events/comment-added.event';

@Injectable()
export class CommentsService {
  constructor(
    @InjectRepository(Comment) private readonly comments: Repository<Comment>,
    private readonly tickets: TicketsService,
    private readonly events: EventEmitter2,
  ) {}

  async list(
    user: User,
    ticketId: number,
    query: ListCommentsQueryDto,
  ): Promise<CommentListResponseDto> {
    await this.tickets.findVisibleOrFail(user, ticketId);
    // Defaults are applied here because an empty query value ("?page=") arrives as undefined.
    const page = query.page ?? DEFAULT_PAGE;
    const limit = query.limit ?? DEFAULT_LIMIT;

    const [items, total] = await this.comments.findAndCount({
      where: { ticketId },
      relations: { author: true },
      // The id tiebreaker keeps page boundaries stable when timestamps repeat.
      order: { createdAt: 'ASC', id: 'ASC' },
      skip: (page - 1) * limit,
      take: limit,
    });

    return { items: items.map(toCommentResponse), total, page, limit };
  }

  async create(user: User, ticketId: number, dto: CreateCommentDto): Promise<CommentResponseDto> {
    const ticket = await this.tickets.findVisibleOrFail(user, ticketId);
    const saved = await this.comments.save(
      this.comments.create({ ticketId, authorId: user.id, body: dto.body }),
    );
    const comment = toCommentResponse(
      await this.comments.findOneOrFail({ where: { id: saved.id }, relations: { author: true } }),
    );

    const event: CommentAddedEvent = { comment, ticketId, ticketCreatedById: ticket.createdById };
    this.events.emit(COMMENT_ADDED, event);
    return comment;
  }
}
