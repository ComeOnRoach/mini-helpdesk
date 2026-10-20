import { Body, Controller, HttpCode, Logger, Post } from '@nestjs/common';
import { ApiBody, ApiConsumes, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../common/decorators/public.decorator';

// Browsers send either { "csp-report": {...} } (report-uri) or [{ type, body }] (Reporting API).
function describe(report: unknown): string {
  const item: unknown = Array.isArray(report) ? report[0] : report;
  if (typeof item !== 'object' || item === null) return 'unparsable report';
  const rec = item as Record<string, unknown>;
  const body = (rec['csp-report'] ?? rec.body ?? rec) as Record<string, unknown>;
  const pick = (...keys: string[]): string => {
    for (const key of keys) {
      const value = body[key];
      if (typeof value === 'string' && value !== '') return value.slice(0, 300);
    }
    return '-';
  };
  return [
    `directive=${pick('violated-directive', 'effectiveDirective', 'effective-directive')}`,
    `blocked=${pick('blocked-uri', 'blockedURL')}`,
    `document=${pick('document-uri', 'documentURL')}`,
  ].join(' ');
}

@Public()
@ApiTags('csp')
@Controller('csp-report')
export class CspController {
  private readonly logger = new Logger('CSP');

  @Post()
  @HttpCode(204)
  @ApiOperation({ summary: 'Receive a Content-Security-Policy violation report (logged only)' })
  @ApiConsumes('application/csp-report', 'application/reports+json', 'application/json')
  @ApiBody({
    description: 'Browser violation report',
    schema: {
      type: 'object',
      example: {
        'csp-report': {
          'document-uri': 'http://localhost:5173/tickets',
          'violated-directive': "script-src 'self'",
          'blocked-uri': 'inline',
        },
      },
    },
  })
  @ApiResponse({ status: 204, description: 'Report accepted' })
  receive(@Body() report: unknown): void {
    this.logger.warn(`Violation: ${describe(report)}`);
  }
}
