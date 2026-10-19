import { Controller, Get, Param, ParseIntPipe, Res, StreamableFile } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Response } from 'express';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { User } from '../users/user.entity';
import { AttachmentsService } from './attachments.service';

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('attachments')
export class AttachmentDownloadController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Get(':id/download')
  @ApiOperation({
    summary: 'Download an attached file',
    description:
      'Sends the file with its original name (Content-Disposition: attachment) and the type it was uploaded with. ' +
      'A user can download files only from their own tickets; an agent from any ticket.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Attachment id' })
  @ApiResponse({
    status: 200,
    description: 'File content',
    content: { 'application/octet-stream': { schema: { type: 'string', format: 'binary' } } },
  })
  @ApiResponse({ status: 400, description: 'Invalid id', type: ErrorResponseDto })
  @ApiResponse({
    status: 401,
    description: 'Missing, invalid or expired token',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Attachment or file not found, or the ticket belongs to another user',
    type: ErrorResponseDto,
  })
  download(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    // The file is always a download; nosniff stops browsers from guessing a renderable type.
    res.setHeader('X-Content-Type-Options', 'nosniff');
    return this.attachments.download(user, id);
  }
}
