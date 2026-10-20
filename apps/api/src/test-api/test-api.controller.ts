import { Body, Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
  ApiHeader,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { UserResponseDto } from '../auth/dto/user-response.dto';
import { Public } from '../common/decorators/public.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import {
  CreateTestUserDto,
  ResetResponseDto,
  SeedRequestDto,
  SeedResponseDto,
} from './dto/test-api.dto';
import { TestApiKeyGuard } from './test-api-key.guard';
import { TestApiService } from './test-api.service';

// Registered only when the Test API is enabled; guarded by x-test-key instead of a JWT.
@ApiTags('test')
@ApiHeader({ name: 'x-test-key', required: true, description: 'Value of TEST_API_KEY' })
@ApiUnauthorizedResponse({ type: ErrorResponseDto, description: 'Missing or wrong x-test-key' })
@Public()
@UseGuards(TestApiKeyGuard)
@Controller('test')
export class TestApiController {
  constructor(private readonly service: TestApiService) {}

  @Post('reset')
  @HttpCode(200)
  @ApiOperation({ summary: 'Wipe all data and uploads, then re-run the deterministic seed' })
  @ApiOkResponse({ type: ResetResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto, description: 'DB_NAME does not contain "test"' })
  reset(): Promise<ResetResponseDto> {
    return this.service.reset();
  }

  @Post('seed')
  @ApiOperation({ summary: 'Add extra deterministic tickets (requires the base users)' })
  @ApiCreatedResponse({ type: SeedResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({
    type: ErrorResponseDto,
    description: 'Base users missing: call reset first',
  })
  seed(@Body() dto: SeedRequestDto): Promise<SeedResponseDto> {
    return this.service.seed(dto);
  }

  @Post('users')
  @ApiOperation({ summary: 'Create a user with the given role and password' })
  @ApiCreatedResponse({ type: UserResponseDto })
  @ApiBadRequestResponse({ type: ErrorResponseDto })
  @ApiConflictResponse({ type: ErrorResponseDto, description: 'Email already exists' })
  createUser(@Body() dto: CreateTestUserDto): Promise<UserResponseDto> {
    return this.service.createUser(dto);
  }
}
