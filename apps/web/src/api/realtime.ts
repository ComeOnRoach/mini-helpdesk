import type { TicketComment } from './comments';

// Payload of the `comment.added` message from the API gateway (T5.1).
export interface CommentAddedPayload {
  ticketId: number;
  comment: TicketComment;
}
