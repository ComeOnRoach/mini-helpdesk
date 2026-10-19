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
  ],
})
export class AppModule {}
