import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { validateEnv } from './config/env.validation';
import { HealthModule } from './health/health.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // In Docker the variables come from compose; locally from the repo-root .env.
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    HealthModule,
  ],
})
export class AppModule {}
