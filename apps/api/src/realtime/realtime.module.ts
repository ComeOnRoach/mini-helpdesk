import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TicketsModule } from '../tickets/tickets.module';
import { UsersModule } from '../users/users.module';
import { RealtimeGateway } from './realtime.gateway';

@Module({
  imports: [AuthModule, UsersModule, TicketsModule],
  providers: [RealtimeGateway],
})
export class RealtimeModule {}
