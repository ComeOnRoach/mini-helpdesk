import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, MaxLength, MinLength } from 'class-validator';

export const MAX_COMMENT_LENGTH = 2000;

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

export class CreateCommentDto {
  @ApiProperty({
    minLength: 1,
    maxLength: MAX_COMMENT_LENGTH,
    example: 'I restarted the router, the problem is still there.',
  })
  @Transform(trim)
  @IsString({ message: 'body must be a string' })
  @MinLength(1, { message: 'body must not be empty' })
  @MaxLength(MAX_COMMENT_LENGTH, {
    message: `body must be at most ${MAX_COMMENT_LENGTH} characters`,
  })
  body: string;
}
