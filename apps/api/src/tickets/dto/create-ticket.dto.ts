import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { TicketPriority } from '../../common/enums';

export const MAX_TAGS = 10;
export const MAX_TAG_LENGTH = 30;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Tags are trimmed, lowercased and de-duplicated so the exact-match tag filter stays predictable.
const normalizeTags = ({ value }: { value: unknown }) =>
  Array.isArray(value)
    ? [
        ...new Set(
          value.map((tag: unknown) => (typeof tag === 'string' ? tag.trim().toLowerCase() : tag)),
        ),
      ]
    : value;

export class CreateTicketDto {
  @ApiProperty({ minLength: 3, maxLength: 120, example: 'Cannot log in' })
  @Transform(trim)
  @IsString({ message: 'title must be a string' })
  @MinLength(3, { message: 'title must be at least 3 characters' })
  @MaxLength(120, { message: 'title must be at most 120 characters' })
  title: string;

  @ApiProperty({ maxLength: 5000, example: 'The login form shows an error after I submit it.' })
  @Transform(trim)
  @IsString({ message: 'description must be a string' })
  @MinLength(1, { message: 'description must not be empty' })
  @MaxLength(5000, { message: 'description must be at most 5000 characters' })
  description: string;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.Medium })
  @IsEnum(TicketPriority, {
    message: `priority must be one of: ${Object.values(TicketPriority).join(', ')}`,
  })
  @IsOptional()
  priority?: TicketPriority;

  @ApiPropertyOptional({
    type: [String],
    maxItems: MAX_TAGS,
    description: `Up to ${MAX_TAGS} tags of 1 to ${MAX_TAG_LENGTH} characters; stored trimmed, lowercase and unique`,
    example: ['bug', 'ui'],
  })
  @Transform(normalizeTags)
  @IsArray({ message: 'tags must be an array' })
  @ArrayMaxSize(MAX_TAGS, { message: `tags must contain at most ${MAX_TAGS} items` })
  @IsString({ each: true, message: 'each tag must be a string' })
  @MinLength(1, { each: true, message: 'a tag must not be empty' })
  @MaxLength(MAX_TAG_LENGTH, {
    each: true,
    message: `a tag must be at most ${MAX_TAG_LENGTH} characters`,
  })
  @IsOptional()
  tags?: string[];
}
