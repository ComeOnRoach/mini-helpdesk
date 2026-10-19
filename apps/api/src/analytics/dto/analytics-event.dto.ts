import { ApiProperty } from '@nestjs/swagger';
import { IsIn, IsInt, IsString, MaxLength, Min } from 'class-validator';

export const ANALYTICS_EVENTS = [
  'login',
  'ticket_create',
  'ticket_open',
  'search',
  'export',
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

export class AnalyticsEventDto {
  @ApiProperty({ enum: ANALYTICS_EVENTS, example: 'ticket_open' })
  @IsIn(ANALYTICS_EVENTS, { message: `event must be one of: ${ANALYTICS_EVENTS.join(', ')}` })
  event: AnalyticsEventName;

  @ApiProperty({
    description: 'Route the event happened on',
    example: '/tickets/3',
    maxLength: 200,
  })
  @IsString({ message: 'page must be a string' })
  @MaxLength(200, { message: 'page must be at most 200 characters' })
  page: string;

  @ApiProperty({ description: 'Client time, epoch milliseconds', example: 1767603600000 })
  @IsInt({ message: 'ts must be an integer (epoch milliseconds)' })
  @Min(0, { message: 'ts must not be negative' })
  ts: number;
}
