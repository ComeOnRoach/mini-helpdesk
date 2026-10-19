import { Module, UnsupportedMediaTypeException } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { randomUUID } from 'node:crypto';
import { extname } from 'node:path';
import { diskStorage } from 'multer';
import { FileStorageService } from '../storage/file-storage.service';
import { StorageModule } from '../storage/storage.module';
import { TicketsModule } from '../tickets/tickets.module';
import { Attachment } from './attachment.entity';
import { ALLOWED_EXTENSIONS, isAllowedFile } from './attachment-types';
import { AttachmentDownloadController } from './attachment-download.controller';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Attachment]),
    TicketsModule,
    StorageModule,
    MulterModule.registerAsync({
      imports: [StorageModule],
      inject: [FileStorageService],
      useFactory: (storage: FileStorageService) => ({
        // Too large a file ends as 413 (LIMIT_FILE_SIZE is mapped by @nestjs/platform-express).
        limits: { fileSize: storage.maxUploadBytes, files: 1 },
        storage: diskStorage({
          destination: storage.uploadDir,
          // A generated name; the user-supplied name never touches the file system.
          filename: (_req, file, callback) =>
            callback(null, `${randomUUID()}${extname(file.originalname).toLowerCase()}`),
        }),
        fileFilter: (_req, file, callback) => {
          if (isAllowedFile(file.originalname, file.mimetype)) {
            callback(null, true);
          } else {
            callback(
              new UnsupportedMediaTypeException(
                `File type is not allowed. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`,
              ),
              false,
            );
          }
        },
      }),
    }),
  ],
  controllers: [AttachmentsController, AttachmentDownloadController],
  providers: [AttachmentsService],
})
export class AttachmentsModule {}
