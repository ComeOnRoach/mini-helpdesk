import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.setGlobalPrefix('api', { exclude: ['health'] });
  app.enableCors({ origin: config.get<string>('WEB_ORIGIN', 'http://localhost:5173') });

  const document = SwaggerModule.createDocument(
    app,
    new DocumentBuilder()
      .setTitle('Mini Helpdesk API')
      .setDescription('Ticketing system API')
      .setVersion('1.0')
      .addBearerAuth()
      .build(),
  );
  SwaggerModule.setup('docs', app, document);

  await app.listen(config.get<number>('PORT', 3000), '0.0.0.0');
}

void bootstrap();
