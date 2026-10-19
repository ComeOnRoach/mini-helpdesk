import { CommentResponseDto } from '../dto/comment-response.dto';

export const COMMENT_ADDED = 'comment.added';

// ticketCreatedById lets the T5.1 gateway route the event: room `ticket:<id>` and `agents`,
// never to other users.
export interface CommentAddedEvent {
  comment: CommentResponseDto;
  ticketId: number;
  ticketCreatedById: number;
}
