import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { TicketPriority, TicketStatus, UserRole } from '../../common/enums';

export class SeedRequestDto {
  @ApiPropertyOptional({ example: 5, default: 5, minimum: 1, maximum: 100 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  tickets?: number;

  @ApiPropertyOptional({ enum: TicketStatus, default: TicketStatus.Open })
  @IsOptional()
  @IsEnum(TicketStatus)
  status?: TicketStatus;

  @ApiPropertyOptional({ enum: TicketPriority, default: TicketPriority.Medium })
  @IsOptional()
  @IsEnum(TicketPriority)
  priority?: TicketPriority;

  @ApiPropertyOptional({ example: 'user@example.com', default: 'user@example.com' })
  @IsOptional()
  @IsEmail()
  createdBy?: string;
}

export class CreateTestUserDto {
  @ApiProperty({ example: 'qa@example.com' })
  @IsEmail()
  @MaxLength(255)
  email: string;

  @ApiProperty({ example: 'Qa12345!', minLength: 8 })
  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password: string;

  @ApiPropertyOptional({ enum: UserRole, default: UserRole.User })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}

export class ResetResponseDto {
  @ApiProperty({ example: 2 })
  users: number;

  @ApiProperty({ example: 12 })
  tickets: number;

  @ApiProperty({ example: 8 })
  comments: number;

  @ApiProperty({ example: 0, description: 'Uploaded files removed from disk' })
  filesRemoved: number;
}

export class SeedResponseDto {
  @ApiProperty({ example: 5 })
  created: number;

  @ApiProperty({ type: [Number], example: [13, 14, 15, 16, 17] })
  ticketIds: number[];
}
