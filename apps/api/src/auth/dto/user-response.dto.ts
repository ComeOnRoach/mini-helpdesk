import { ApiProperty } from '@nestjs/swagger';
import { UserRole } from '../../common/enums';
import { User } from '../../users/user.entity';

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

export function toUserResponse(user: User): UserResponseDto {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}
