import {
  Controller,
  Delete,
  HttpCode,
  Param,
  ParseIntPipe,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { ErrorResponseDto } from '../common/error-response.dto';
import { User } from '../users/user.entity';
import { AttachmentsService } from './attachments.service';
import { AttachmentResponseDto, UploadAttachmentBodyDto } from './dto/attachment-response.dto';

const UNAUTHORIZED = {
  status: 401,
  description: 'Missing, invalid or expired token',
  type: ErrorResponseDto,
};
const NOT_FOUND = {
  status: 404,
  description: 'Ticket or attachment not found, or the ticket belongs to another user',
  type: ErrorResponseDto,
};

@ApiTags('attachments')
@ApiBearerAuth()
@Controller('tickets/:id/attachments')
export class AttachmentsController {
  constructor(private readonly attachments: AttachmentsService) {}

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Attach a file to a ticket',
    description:
      'Multipart form with one file in the field "file". Allowed: png, jpg, pdf, txt, csv. ' +
      'A user can attach files only to their own tickets; an agent to any ticket.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Ticket id' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({ type: UploadAttachmentBodyDto })
  @ApiResponse({ status: 201, type: AttachmentResponseDto })
  @ApiResponse({ status: 400, description: 'Invalid id or no file sent', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  @ApiResponse(NOT_FOUND)
  @ApiResponse({
    status: 413,
    description: 'File is larger than the limit',
    type: ErrorResponseDto,
  })
  @ApiResponse({ status: 415, description: 'File type is not allowed', type: ErrorResponseDto })
  create(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File | undefined,
  ): Promise<AttachmentResponseDto> {
    return this.attachments.create(user, id, file);
  }

  @Delete(':attachmentId')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete an attachment',
    description: 'Removes the record and the stored file. Allowed for the ticket owner and agents.',
  })
  @ApiParam({ name: 'id', example: 1, description: 'Ticket id' })
  @ApiParam({ name: 'attachmentId', example: 1 })
  @ApiResponse({ status: 204, description: 'Deleted' })
  @ApiResponse({ status: 400, description: 'Invalid id', type: ErrorResponseDto })
  @ApiResponse(UNAUTHORIZED)
  @ApiResponse(NOT_FOUND)
  remove(
    @CurrentUser() user: User,
    @Param('id', ParseIntPipe) id: number,
    @Param('attachmentId', ParseIntPipe) attachmentId: number,
  ): Promise<void> {
    return this.attachments.remove(user, id, attachmentId);
  }
}
