import { ApiProperty } from '@nestjs/swagger';
import { Attachment } from '../attachment.entity';

export class AttachmentResponseDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 3 })
  ticketId: number;

  @ApiProperty({ example: 'screenshot.png', description: 'Original file name' })
  filename: string;

  @ApiProperty({ example: 'image/png' })
  mime: string;

  @ApiProperty({ example: 20480, description: 'Size in bytes' })
  size: number;

  @ApiProperty({ example: '2026-01-05T09:00:00.000Z' })
  createdAt: Date;

  // The server-side file path is internal and not returned.
  static from(attachment: Attachment): AttachmentResponseDto {
    return {
      id: attachment.id,
      ticketId: attachment.ticketId,
      filename: attachment.filename,
      mime: attachment.mime,
      size: attachment.size,
      createdAt: attachment.createdAt,
    };
  }
}

export class UploadAttachmentBodyDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'png, jpg, pdf, txt or csv; up to MAX_UPLOAD_BYTES (5 MB by default)',
  })
  file: unknown;
}
