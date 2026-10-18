import { Body, Controller, Get, HttpCode, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { Public } from '../common/decorators/public.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { AuthService } from './auth.service';
import { AuthResponseDto } from './dto/auth-response.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { User } from '../users/user.entity';
import { toUserResponse, UserResponseDto } from './dto/user-response.dto';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user (role: user)' })
  @ApiResponse({ status: 201, description: 'User created', type: UserResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid email or password', type: ErrorResponseDto })
  @ApiResponse({ status: 409, description: 'Email is already registered', type: ErrorResponseDto })
  register(@Body() dto: RegisterDto): Promise<UserResponseDto> {
    return this.auth.register(dto);
  }

  @Public()
  @Post('login')
  @HttpCode(200)
  @ApiOperation({ summary: 'Log in and get an access token' })
  @ApiResponse({ status: 200, description: 'Logged in', type: AuthResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid request body', type: ErrorResponseDto })
  @ApiResponse({ status: 401, description: 'Wrong email or password', type: ErrorResponseDto })
  login(@Body() dto: LoginDto): Promise<AuthResponseDto> {
    return this.auth.login(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Current user' })
  @ApiResponse({ status: 200, description: 'Current user', type: UserResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired token',
    type: ErrorResponseDto,
  })
  me(@CurrentUser() user: User): UserResponseDto {
    return toUserResponse(user);
  }
}
