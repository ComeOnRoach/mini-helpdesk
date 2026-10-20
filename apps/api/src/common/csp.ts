import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NextFunction, Request, Response } from 'express';
import helmet from 'helmet';

// Content-Security-Policy for API responses. Only the CSP header is set (no other helmet headers).
// CSP_ENABLED=true turns it on; CSP_REPORT_ONLY=true sends it as Content-Security-Policy-Report-Only.
// Note: this protects documents served by the API origin (e.g. Swagger); the web app origin gets
// its own header from the Vite plugin in apps/web/vite.config.ts.
export function applyCsp(app: INestApplication, config: ConfigService): void {
  if (config.get<string>('CSP_ENABLED') !== 'true') return;

  const reportOnly = config.get<string>('CSP_REPORT_ONLY') === 'true';
  const webOrigin = config.get<string>('WEB_ORIGIN', 'http://localhost:5173');
  const reportUri = '/api/csp-report';

  const strict = helmet.contentSecurityPolicy({
    useDefaults: false,
    reportOnly,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'", webOrigin],
      frameSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      frameAncestors: ["'self'", webOrigin],
      reportUri: [reportUri],
    },
  });

  // Swagger UI (/docs) needs inline scripts and styles, so it gets a relaxed policy.
  const swagger = helmet.contentSecurityPolicy({
    useDefaults: false,
    reportOnly,
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:'],
      connectSrc: ["'self'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      reportUri: [reportUri],
    },
  });

  app.use((req: Request, res: Response, next: NextFunction) => {
    const isDocs = req.path === '/docs' || req.path.startsWith('/docs/');
    (isDocs ? swagger : strict)(req, res, next);
  });
}
