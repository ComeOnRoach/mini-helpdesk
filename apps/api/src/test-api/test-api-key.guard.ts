import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, timingSafeEqual } from 'node:crypto';
import type { Request } from 'express';

const digest = (value: string) => createHash('sha256').update(value).digest();

// Protects the Test API with a shared secret in the x-test-key header (missing and wrong are both 401).
@Injectable()
export class TestApiKeyGuard implements CanActivate {
  private readonly expected: Buffer;

  constructor(config: ConfigService) {
    const key = config.get<string>('TEST_API_KEY');
    if (!key) {
      throw new Error('TEST_API_KEY is required when the Test API is enabled');
    }
    this.expected = digest(key);
  }

  canActivate(context: ExecutionContext): boolean {
    const header = context.switchToHttp().getRequest<Request>().headers['x-test-key'];
    const provided = Array.isArray(header) ? header[0] : header;
    if (!provided || !timingSafeEqual(digest(provided), this.expected)) {
      throw new UnauthorizedException('Missing or invalid x-test-key header');
    }
    return true;
  }
}
