import {
  CallHandler,
  ExecutionContext,
  Injectable,
  InternalServerErrorException,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Request } from 'express';
import { Observable, switchMap, timer } from 'rxjs';

// Routes that are never slowed down or failed on purpose.
const EXEMPT_PREFIXES = ['/health', '/api/analytics', '/api/test'];
// The only route that can fail on purpose: the tickets list.
const FLAKY_PATH = '/api/tickets';
const MAX_HEADER_DELAY_MS = 10_000;

// Random on purpose: every call is an independent coin flip (0 never fails, 1 always fails).
export function shouldFail(rate: number, random: () => number = Math.random): boolean {
  return random() < rate;
}

// Instability modes for practising waits, timeouts and retries. Off by default (see README).
@Injectable()
export class InstabilityInterceptor implements NestInterceptor {
  private readonly logger = new Logger(InstabilityInterceptor.name);
  private readonly slowMs: number;
  private readonly flakyRate: number;
  private readonly headerAllowed: boolean;

  constructor(config: ConfigService) {
    this.slowMs = Number(config.get('SLOW_API_MS') || 0);
    this.flakyRate = Number(config.get('FLAKY_RATE') || 0);
    const nodeEnv = config.get<string>('NODE_ENV', 'development');
    // Never in production, even if the test API flag is set.
    this.headerAllowed =
      nodeEnv !== 'production' &&
      (nodeEnv === 'test' || config.get<string>('ENABLE_TEST_API') === 'true');
    if (nodeEnv === 'production' && (this.slowMs > 0 || this.flakyRate > 0)) {
      this.logger.warn(
        `Instability modes are enabled in production (SLOW_API_MS=${this.slowMs}, FLAKY_RATE=${this.flakyRate})`,
      );
    }
  }

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest<Request>();
    const path = request.originalUrl.split('?')[0].replace(/\/+$/, '');
    if (EXEMPT_PREFIXES.some((p) => path === p || path.startsWith(`${p}/`))) return next.handle();

    const delayMs = this.delayFor(request);
    const fail =
      this.flakyRate > 0 &&
      request.method === 'GET' &&
      path === FLAKY_PATH &&
      shouldFail(this.flakyRate);
    if (delayMs === 0 && !fail) return next.handle();

    return timer(delayMs).pipe(
      switchMap(() => {
        if (fail) throw new InternalServerErrorException('Simulated failure (FLAKY_RATE)');
        return next.handle();
      }),
    );
  }

  // x-delay-ms replaces SLOW_API_MS for one request; only honoured in test mode.
  private delayFor(request: Request): number {
    const header = request.headers['x-delay-ms'];
    if (this.headerAllowed && typeof header === 'string' && /^\d+$/.test(header)) {
      return Math.min(Number(header), MAX_HEADER_DELAY_MS);
    }
    return this.slowMs;
  }
}
