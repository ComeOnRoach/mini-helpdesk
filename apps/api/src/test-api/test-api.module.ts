import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Attachment } from '../attachments/attachment.entity';
import { SeedModule } from '../seed/seed.module';
import { StorageModule } from '../storage/storage.module';
import { Ticket } from '../tickets/ticket.entity';
import { User } from '../users/user.entity';
import { TestApiController } from './test-api.controller';
import { TestApiService } from './test-api.service';
import { TestApiKeyGuard } from './test-api-key.guard';

// Imported by AppModule only when isTestApiEnabled() is true; otherwise the routes do not exist (404).
@Module({
  imports: [TypeOrmModule.forFeature([User, Ticket, Attachment]), SeedModule, StorageModule],
  controllers: [TestApiController],
  providers: [TestApiService, TestApiKeyGuard],
})
export class TestApiModule {}
