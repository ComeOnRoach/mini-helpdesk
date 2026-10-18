import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto';

const BCRYPT_ROUNDS = 10;
// Compared against when the email is unknown, so both login failures take similar time.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', BCRYPT_ROUNDS);

export interface JwtPayload {
  sub: number;
  role: UserRole;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly users: UsersService,
    private readonly jwt: JwtService,
  ) {}

  async register(dto: RegisterDto): Promise<UserResponseDto> {
    if (await this.users.existsByEmail(dto.email)) {
      throw new ConflictException('A user with this email already exists');
    }
    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
    try {
      return toUserResponse(await this.users.create(dto.email, passwordHash));
    } catch (error) {
      // Two simultaneous registrations can both pass the check above; the unique index decides.
      if ((error as { code?: string }).code === 'ER_DUP_ENTRY') {
        throw new ConflictException('A user with this email already exists');
      }
      throw error;
    }
  }

  async login(dto: LoginDto): Promise<AuthResponseDto> {
    const user = await this.users.findByEmailWithPassword(dto.email);
    const matches = await bcrypt.compare(dto.password, user?.passwordHash ?? DUMMY_HASH);
    if (!user || !matches) {
      throw new UnauthorizedException('Invalid email or password');
    }
    const payload: JwtPayload = { sub: user.id, role: user.role };
    return { accessToken: await this.jwt.signAsync(payload), user: toUserResponse(user) };
  }
}
