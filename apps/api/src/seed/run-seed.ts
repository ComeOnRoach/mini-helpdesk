import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { validateEnv } from '../config/env.validation';
import { DatabaseModule } from '../database/database.module';
import { SeedModule } from './seed.module';
import { SeedService } from './seed.service';

// CLI entry point for `npm run seed`. Applies pending migrations (DatabaseModule), then seeds.
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    DatabaseModule,
    SeedModule,
  ],
})
class SeedCliModule {}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'Refusing to seed: the seed accounts have known passwords (NODE_ENV=production)',
    );
  }
  const app = await NestFactory.createApplicationContext(SeedCliModule, {
    logger: ['log', 'warn', 'error'],
  });
  try {
    await app.get(SeedService).run();
  } finally {
    await app.close();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
