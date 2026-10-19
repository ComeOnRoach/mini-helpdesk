import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { basename } from 'node:path';
import { Repository } from 'typeorm';
import { FileStorageService } from '../storage/file-storage.service';
import { TicketsService } from '../tickets/tickets.service';
import { User } from '../users/user.entity';
import { Attachment } from './attachment.entity';
import { AttachmentResponseDto } from './dto/attachment-response.dto';

const MAX_NAME_LENGTH = 255;

// Multer reads the multipart file name as latin1; restore UTF-8 names (e.g. Cyrillic).
function cleanFileName(originalName: string): string {
  const decoded = Buffer.from(originalName, 'latin1').toString('utf8');
  // eslint-disable-next-line no-control-regex
  const name = basename(decoded.replace(/\\/g, '/')).replace(/[\u0000-\u001f]/g, '');
  return name.slice(-MAX_NAME_LENGTH) || 'file';
}

@Injectable()
export class AttachmentsService {
  constructor(
    @InjectRepository(Attachment) private readonly attachments: Repository<Attachment>,
    private readonly tickets: TicketsService,
    private readonly storage: FileStorageService,
  ) {}

  async create(
    user: User,
    ticketId: number,
    file: Express.Multer.File | undefined,
  ): Promise<AttachmentResponseDto> {
    if (!file) {
      throw new BadRequestException('File is required (multipart field "file")');
    }
    try {
      // Multer has already written the file, so every failure below must remove it again.
      await this.tickets.findVisibleOrFail(user, ticketId);
      const saved = await this.attachments.save(
        this.attachments.create({
          ticketId,
          filename: cleanFileName(file.originalname),
          path: file.filename,
          mime: file.mimetype,
          size: file.size,
        }),
      );
      return AttachmentResponseDto.from(saved);
    } catch (error) {
      await this.storage.remove(file.filename);
      throw error;
    }
  }

  async remove(user: User, ticketId: number, attachmentId: number): Promise<void> {
    await this.tickets.findVisibleOrFail(user, ticketId);
    const attachment = await this.attachments.findOneBy({ id: attachmentId, ticketId });
    if (!attachment) {
      throw new NotFoundException('Attachment not found');
    }
    await this.attachments.delete({ id: attachment.id });
    await this.storage.remove(attachment.path);
  }
}
