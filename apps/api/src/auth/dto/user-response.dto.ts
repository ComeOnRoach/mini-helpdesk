import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';

export class UserResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ enum: UserRole, example: UserRole.User })
  role: UserRole;

  @ApiProperty({ example: '2026-01-05T09:00:00.000Z' })
  createdAt: Date;
}
