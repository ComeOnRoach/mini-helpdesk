import { ApiProperty } from '@nestjs/swagger';
import { TicketPriority, TicketStatus } from '../../common/enums';

export class TicketResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'Cannot log in' })
  title: string;

  @ApiProperty({ example: 'The login form shows an error after I submit it.' })
  description: string;

  @ApiProperty({ enum: TicketStatus, example: TicketStatus.Open })
  status: TicketStatus;

  @ApiProperty({ enum: TicketPriority, example: TicketPriority.High })
  priority: TicketPriority;

  @ApiProperty({ type: [String], example: ['bug', 'ui'] })
  tags: string[];

  @ApiProperty({ example: 1 })
  createdById: number;

  @ApiProperty({ type: Number, nullable: true, example: null })
  assigneeId: number | null;

  @ApiProperty({ example: '2026-01-05T09:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-05T09:00:00.000Z' })
  updatedAt: Date;
}

export class TicketListResponseDto {
  @ApiProperty({ type: [TicketResponseDto] })
  items: TicketResponseDto[];

  @ApiProperty({
    description: 'Number of tickets matching the filters, across all pages',
    example: 12,
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 10 })
  limit: number;
}
