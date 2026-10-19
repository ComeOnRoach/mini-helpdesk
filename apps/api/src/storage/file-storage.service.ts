import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createReadStream } from 'node:fs';
import type { ReadStream } from 'node:fs';
import { stat, unlink } from 'node:fs/promises';
import { basename, join, resolve } from 'node:path';

export const DEFAULT_MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

// Owns the upload directory: where files live, the size limit, and removal.
@Injectable()
export class FileStorageService {
  private readonly logger = new Logger(FileStorageService.name);
  readonly uploadDir: string;
  readonly maxUploadBytes: number;

  constructor(config: ConfigService) {
    this.uploadDir = resolve(config.get<string>('UPLOAD_DIR') || join(process.cwd(), 'uploads'));
    this.maxUploadBytes =
      Number(config.get<string>('MAX_UPLOAD_BYTES')) || DEFAULT_MAX_UPLOAD_BYTES;
  }

  // Opens a stored file for reading; null when it is missing from the disk.
  async open(storedName: string): Promise<{ stream: ReadStream; size: number } | null> {
    // basename() keeps a damaged DB value from pointing outside the upload directory.
    const filePath = join(this.uploadDir, basename(storedName));
    try {
      const { size } = await stat(filePath);
      return { stream: createReadStream(filePath), size };
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') return null;
      throw error;
    }
  }

  // Deletes a stored file by its generated name. A missing file is not an error.
  async remove(storedName: string): Promise<void> {
    try {
      // basename() keeps a damaged DB value from pointing outside the upload directory.
      await unlink(join(this.uploadDir, basename(storedName)));
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'ENOENT') {
        this.logger.warn(`Could not delete file ${storedName}: ${(error as Error).message}`);
      }
    }
  }

  async removeMany(storedNames: string[]): Promise<void> {
    await Promise.all(storedNames.map((name) => this.remove(name)));
  }
}
