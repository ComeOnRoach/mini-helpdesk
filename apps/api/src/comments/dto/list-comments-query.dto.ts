import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';
import { MAX_LIMIT, toNumber } from '../../tickets/dto/list-tickets-query.dto';

export class ListCommentsQueryDto {
  @ApiPropertyOptional({ minimum: 1, default: 1, example: 1 })
  @Transform(toNumber)
  @IsInt({ message: 'page must be a whole number' })
  @Min(1, { message: 'page must be at least 1' })
  @IsOptional()
  page?: number;

  @ApiPropertyOptional({ minimum: 1, maximum: MAX_LIMIT, default: 10, example: 10 })
  @Transform(toNumber)
  @IsInt({ message: 'limit must be a whole number' })
  @Min(1, { message: 'limit must be at least 1' })
  @Max(MAX_LIMIT, { message: `limit must be at most ${MAX_LIMIT}` })
  @IsOptional()
  limit?: number;
}
