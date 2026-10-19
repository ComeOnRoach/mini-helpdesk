import { TicketResponseDto } from '../dto/ticket-response.dto';

export const TICKET_CREATED = 'ticket.created';
export const TICKET_UPDATED = 'ticket.updated';

// The T5.1 gateway turns these into socket messages; services do not know about sockets.
export interface TicketCreatedEvent {
  ticket: TicketResponseDto;
}

export interface TicketUpdatedEvent {
  ticket: TicketResponseDto;
  changedFields: string[];
  actorId: number;
}
