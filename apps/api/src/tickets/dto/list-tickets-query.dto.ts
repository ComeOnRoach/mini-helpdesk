import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsString, Matches, Max, MaxLength, Min } from 'class-validator';
import { TicketPriority, TicketStatus } from '../../common/enums';

export const SORT_FIELDS = ['createdAt', 'updatedAt', 'priority', 'status', 'title', 'id'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 10;
export const MAX_LIMIT = 50;
export const DEFAULT_SORT = 'createdAt:desc';

// An empty value such as "?q=" or "?status=" means "no filter", so forms can send it as is.
const emptyToUndefined = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() === '' ? undefined : value;

// Query strings arrive as text; empty means "not given" and anything else is parsed as a number.
const toNumber = ({ value }: { value: unknown }) =>
  typeof value === 'string' && value.trim() !== '' ? Number(value) : undefined;

export class ListTicketsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1 })
  @Transform(toNumber)
  @IsInt({ message: 'page must be a whole number' })
  @Min(1, { message: 'page must be at least 1' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_LIMIT, default: 10 })
  @Transform(toNumber)
  @IsInt({ message: 'limit must be a whole number' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(MAX_LIMIT, { message: `limit must be at most ${MAX_LIMIT}` })
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ enum: TicketStatus })
  @Transform(emptyToUndefined)
  @IsEnum(TicketStatus, {
    message: `status must be one of: ${Object.values(TicketStatus).join(', ')}`,
  })
  @IsOptional()
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority })
  @Transform(emptyToUndefined)
  @IsEnum(TicketPriority, {
    message: `priority must be one of: ${Object.values(TicketPriority).join(', ')}`,
  })
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({ description: 'Exact tag, for example "bug"', maxLength: 30 })
  @Transform(emptyToUndefined)
  @IsString()
  @MaxLength(30, { message: 'tag must be at most 30 characters' })
  @IsOptional()
  tag?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive text search in title and description',
    maxLength: 100,
  })
  @Transform(({ value }: { value: unknown }) =>
    emptyToUndefined({ value: typeof value === 'string' ? value.trim() : value }),
  )
  @IsString()
  @MaxLength(100, { message: 'q must be at most 100 characters' })
  @IsOptional()
  q?: string;

  @ApiPropertyOptional({
    description: `field:direction. Fields: ${SORT_FIELDS.join(', ')}; direction: asc or desc`,
    default: DEFAULT_SORT,
    example: DEFAULT_SORT,
  })
  @Transform(emptyToUndefined)
  @Matches(new RegExp(`^(${SORT_FIELDS.join('|')}):(asc|desc)$`), {
    message: `sort must look like field:direction, with field one of ${SORT_FIELDS.join(', ')} and direction asc or desc`,
  })
  @IsOptional()
  sort?: string;
}
