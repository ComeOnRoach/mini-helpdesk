import { ApiProperty } from '@nestjs/swagger';

export class ErrorResponseDto {
  @ApiProperty({ example: 400 })
  statusCode: number;

  @ApiProperty({ example: 'Bad Request' })
  error: string;

  @ApiProperty({
    description: 'A single message, or a list of validation messages',
    oneOf: [{ type: 'string' }, { type: 'array', items: { type: 'string' } }],
    example: ['email must be a valid email address'],
  })
  message: string | string[];

  @ApiProperty({ example: '/api/auth/login' })
  path: string;

  @ApiProperty({ example: '2026-01-05T09:00:00.000Z' })
  timestamp: string;
}
