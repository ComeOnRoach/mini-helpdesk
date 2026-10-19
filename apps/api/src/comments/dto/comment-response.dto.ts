import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';
import { Comment } from '../comment.entity';

export class CommentAuthorDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.User })
  role: UserRole;
}

export class CommentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 3 })
  ticketId: number;

  @ApiProperty({ example: 'I restarted the router, the problem is still there.' })
  body: string;

  @ApiProperty({ type: CommentAuthorDto })
  author: CommentAuthorDto;

  @ApiProperty({ example: '2026-01-05T09:00:00.000Z' })
  createdAt: Date;
}

export class CommentListResponseDto {
  @ApiProperty({ type: [CommentResponseDto] })
  items: CommentResponseDto[];

  @ApiProperty({ description: 'Number of comments on the ticket, across all pages', example: 4 })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}

// Only id, email and role of the author are exposed; never the password hash.
export function toCommentResponse(comment: Comment): CommentResponseDto {
  return {
    id: comment.id,
    ticketId: comment.ticketId,
    body: comment.body,
    author: { id: comment.author.id, email: comment.author.email, role: comment.author.role },
    createdAt: comment.createdAt,
  };
}
