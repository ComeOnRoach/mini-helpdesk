import { JwtService } from '@nestjs/jwt';
import { OnEvent } from '@nestjs/event-emitter';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import type { Server, Socket } from 'socket.io';
import type { JwtPayload } from '../auth/auth.service';
import { COMMENT_ADDED } from '../comments/events/comment-added.event';
import type { CommentAddedEvent } from '../comments/events/comment-added.event';
import { UserRole } from '../common/enums';
import { TICKET_CREATED, TICKET_UPDATED } from '../tickets/events/ticket-events';
import type { TicketCreatedEvent, TicketUpdatedEvent } from '../tickets/events/ticket-events';
import { TicketsService } from '../tickets/tickets.service';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import {
  AGENTS_ROOM,
  RoomAck,
  SUBSCRIBE_TICKET,
  UNSUBSCRIBE_TICKET,
  ticketRoom,
  userRoom,
} from './realtime-events';

@WebSocketGateway()
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection {
  @WebSocketServer()
  private server!: Server;

  constructor(
    private readonly jwt: JwtService,
    private readonly users: UsersService,
    private readonly tickets: TicketsService,
  ) {}

  // The token is checked in a middleware, so a bad handshake never becomes a connection:
  // the client gets `connect_error` with the message "Unauthorized".
  afterInit(server: Server): void {
    server.use((socket, next) => {
      this.authenticate(socket).then(
        (user) => {
          socket.data.user = user;
          next();
        },
        () => next(new Error('Unauthorized')),
      );
    });
  }

  handleConnection(client: Socket): void {
    const user = client.data.user as User;
    void client.join(userRoom(user.id));
    if (user.role === UserRole.Agent) {
      void client.join(AGENTS_ROOM);
    }
  }

  @SubscribeMessage(SUBSCRIBE_TICKET)
  async subscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { ticketId?: unknown } | null,
  ): Promise<RoomAck> {
    const ticketId = body?.ticketId;
    if (typeof ticketId !== 'number' || !Number.isInteger(ticketId)) {
      return { ok: false, message: 'ticketId must be an integer' };
    }
    try {
      // The same access rule as the REST API; someone else's ticket answers like a missing one.
      await this.tickets.findVisibleOrFail(client.data.user as User, ticketId);
    } catch {
      return { ok: false, message: 'Ticket not found' };
    }
    await client.join(ticketRoom(ticketId));
    return { ok: true };
  }

  @SubscribeMessage(UNSUBSCRIBE_TICKET)
  async unsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() body: { ticketId?: unknown } | null,
  ): Promise<RoomAck> {
    const ticketId = body?.ticketId;
    if (typeof ticketId !== 'number' || !Number.isInteger(ticketId)) {
      return { ok: false, message: 'ticketId must be an integer' };
    }
    await client.leave(ticketRoom(ticketId));
    return { ok: true };
  }

  @OnEvent(TICKET_CREATED)
  onTicketCreated({ ticket }: TicketCreatedEvent): void {
    // One delivery per socket even when it is in several of these rooms.
    this.server.to([AGENTS_ROOM, userRoom(ticket.createdById)]).emit(TICKET_CREATED, { ticket });
  }

  @OnEvent(TICKET_UPDATED)
  onTicketUpdated(event: TicketUpdatedEvent): void {
    const { ticket } = event;
    this.server
      .to([AGENTS_ROOM, userRoom(ticket.createdById), ticketRoom(ticket.id)])
      .emit(TICKET_UPDATED, event);
  }

  @OnEvent(COMMENT_ADDED)
  onCommentAdded({ comment, ticketId, ticketCreatedById }: CommentAddedEvent): void {
    this.server
      .to([ticketRoom(ticketId), AGENTS_ROOM, userRoom(ticketCreatedById)])
      .emit(COMMENT_ADDED, { ticketId, comment });
  }

  private async authenticate(socket: Socket): Promise<User> {
    const auth = socket.handshake.auth as { token?: unknown };
    const header = socket.handshake.headers.authorization;
    const token =
      typeof auth.token === 'string' && auth.token
        ? auth.token
        : header?.replace(/^Bearer\s+/i, '');
    if (!token) throw new Error('No token');

    const payload = await this.jwt.verifyAsync<JwtPayload>(token);
    const user = await this.users.findById(payload.sub);
    if (!user) throw new Error('Unknown user');
    return user;
  }
}
