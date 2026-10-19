import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { AnalyticsEventDto } from './dto/analytics-event.dto';

@Public()
@ApiTags('analytics')
@Controller('analytics')
export class AnalyticsController {
  @Post('events')
  @HttpCode(204)
  @ApiOperation({ summary: 'Receive a front-end analytics event (nothing is stored)' })
  @ApiResponse({ status: 204, description: 'Event accepted' })
  @ApiResponse({ status: 400, description: 'Invalid event body', type: ErrorResponseDto })
  receive(@Body() dto: AnalyticsEventDto): void {
    void dto;
  }
}
