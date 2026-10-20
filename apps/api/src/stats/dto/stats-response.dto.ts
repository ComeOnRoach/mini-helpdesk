import { ApiProperty } from '@nestjs/swagger';

export class PriorityCountsDto {
  @ApiProperty({ example: 3 })
  low: number;

  @ApiProperty({ example: 5 })
  medium: number;

  @ApiProperty({ example: 2 })
  high: number;
}

export class StatsResponseDto {
  @ApiProperty({ description: 'All tickets visible to the caller', example: 10 })
  total: number;

  @ApiProperty({ description: 'Tickets with status "open"', example: 4 })
  open: number;

  @ApiProperty({ description: 'Tickets with status "in_progress"', example: 3 })
  in_progress: number;

  @ApiProperty({ description: 'Tickets with status "closed"', example: 3 })
  closed: number;

  @ApiProperty({ type: PriorityCountsDto })
  byPriority: PriorityCountsDto;
}
