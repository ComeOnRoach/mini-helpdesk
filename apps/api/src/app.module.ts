import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { AnalyticsModule } from './analytics/analytics.module';
import { AttachmentsModule } from './attachments/attachments.module';
import { AuthModule } from './auth/auth.module';
import { CommentsModule } from './comments/comments.module';
import { RealtimeModule } from './realtime/realtime.module';
import { TicketsModule } from './tickets/tickets.module';
import { validateEnv } from './config/env.validation';
import { DatabaseModule } from './database/database.module';
import { HealthModule } from './health/health.module';
import { TestApiModule } from './test-api/test-api.module';
import { isTestApiEnabled } from './test-api/test-api.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      // In Docker the variables come from compose; locally from the repo-root .env.
      envFilePath: ['.env', '../../.env'],
      validate: validateEnv,
    }),
    DatabaseModule,
    HealthModule,
    AuthModule,
    EventEmitterModule.forRoot(),
    TicketsModule,
    CommentsModule,
    AttachmentsModule,
    RealtimeModule,
    AnalyticsModule,
    // Test API (T7.3): registered only when enabled, so its routes 404 otherwise.
    ...(isTestApiEnabled() ? [TestApiModule] : []),
  ],
})
export class AppModule {}
