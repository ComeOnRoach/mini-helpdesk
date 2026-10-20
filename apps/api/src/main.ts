import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { setupApp } from './common/app-setup';
import { RealtimeIoAdapter } from './realtime/socket-io.adapter';
import { applyCsp } from './common/csp';
import { isTestApiEnabled } from './test-api/test-api.config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  // CSP header (CSP_ENABLED / CSP_REPORT_ONLY); must be registered before the routes.
  applyCsp(app, config);

  app.setGlobalPrefix('api', { exclude: ['health'] });
  setupApp(app);
  app.useWebSocketAdapter(new RealtimeIoAdapter(app));
  app.enableCors({
    origin: config.get<string>('WEB_ORIGIN', 'http://localhost:5173'),
    // Lets the web app read the file name of downloads.
    exposedHeaders: ['Content-Disposition'],
  });

  const swagger = new DocumentBuilder()
    .setTitle('Mini Helpdesk API')
    .setDescription(
      'Ticketing system API. Log in with POST /api/auth/login, then press Authorize and paste the accessToken. ' +
        'Errors use one format: { statusCode, error, message, path, timestamp }.',
    )
    .setVersion('1.0')
    .addBearerAuth();
  // The Test API controller is registered only when it is enabled (never in production),
  // so its routes and its x-test-key scheme appear in the docs only in the same case.
  if (isTestApiEnabled()) {
    swagger.addApiKey({ type: 'apiKey', name: 'x-test-key', in: 'header' }, 'test-key');
  }
  const document = SwaggerModule.createDocument(app, swagger.build());
  SwaggerModule.setup('docs', app, document, {
    swaggerOptions: { persistAuthorization: true },
  });

  await app.listen(config.get<number>('PORT', 3000), '0.0.0.0');
}

void bootstrap();
