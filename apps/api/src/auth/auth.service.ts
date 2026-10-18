import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole } from '../common/enums';
import { User } from '../users/user.entity';
import { UsersService } from '../users/users.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { UserResponseDto } from './dto/user-response.dto';

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

  // Temporary bearer check; T2.2 replaces it with JwtAuthGuard + @CurrentUser().
  async me(authorization: string | undefined): Promise<UserResponseDto> {
    const token = authorization?.startsWith('Bearer ') ? authorization.slice(7) : undefined;
    if (!token) {
      throw new UnauthorizedException('Missing bearer token');
    }
    let payload: JwtPayload;
    try {
      payload = await this.jwt.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
    const user = await this.users.findById(payload.sub);
    if (!user) {
      throw new UnauthorizedException('Invalid or expired token');
    }
    return toUserResponse(user);
  }
}

function toUserResponse(user: User): UserResponseDto {
  return { id: user.id, email: user.email, role: user.role, createdAt: user.createdAt };
}
