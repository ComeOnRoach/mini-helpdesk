import { ApiProperty } from '@nestjs/swagger';
import { TicketResponseDto } from './ticket-response.dto';

export class TicketCommentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 1 })
  ticketId: number;

  @ApiProperty({ example: 2 })
  authorId: number;

  @ApiProperty({ example: 'We are looking into it.' })
  body: string;

  @ApiProperty({ example: '2026-01-05T10:00:00.000Z' })
  createdAt: Date;
}

// The server-side file path is internal and never returned.
export class TicketAttachmentDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'screenshot.png' })
  filename: string;

  @ApiProperty({ example: 'image/png' })
  mime: string;

  @ApiProperty({ description: 'Size in bytes', example: 20480 })
  size: number;

  @ApiProperty({ example: '2026-01-05T10:00:00.000Z' })
  createdAt: Date;
}

export class TicketDetailResponseDto extends TicketResponseDto {
  @ApiProperty({ type: [TicketCommentDto], description: 'Oldest first' })
  comments: TicketCommentDto[];

  @ApiProperty({ type: [TicketAttachmentDto], description: 'Oldest first' })
  attachments: TicketAttachmentDto[];
}
