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
import { CspModule } from './csp/csp.module';
import { TestApiModule } from './test-api/test-api.module';
import { isTestApiEnabled } from './test-api/test-api.config';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { InstabilityInterceptor } from './common/instability.interceptor';
import { StatsModule } from './stats/stats.module';

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
    CspModule,
    // Test API (T7.3): registered only when enabled, so its routes 404 otherwise.
    ...(isTestApiEnabled() ? [TestApiModule] : []),
    StatsModule,
  ],
  providers: [{ provide: APP_INTERCEPTOR, useClass: InstabilityInterceptor }],
})
export class AppModule {}
