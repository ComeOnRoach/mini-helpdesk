import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterDto {
  @ApiProperty({ example: 'new.user@example.com' })
  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim().toLowerCase() : value,
  )
  @IsEmail({}, { message: 'email must be a valid email address' })
  @MaxLength(255, { message: 'email must be at most 255 characters' })
  email: string;

  @ApiProperty({ example: 'Secret123!', minLength: 8, maxLength: 72 })
  @IsString({ message: 'password must be a string' })
  @MinLength(8, { message: 'password must be at least 8 characters' })
  // bcrypt only uses the first 72 bytes.
  @MaxLength(72, { message: 'password must be at most 72 characters' })
  password: string;
}
