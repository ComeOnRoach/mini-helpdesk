import { BadRequestException, ConflictException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { hash } from 'bcrypt';
import { DataSource, Like, Repository } from 'typeorm';
import { Attachment } from '../attachments/attachment.entity';
import { UserResponseDto, toUserResponse } from '../auth/dto/user-response.dto';
import { TicketPriority, TicketStatus, UserRole } from '../common/enums';
import { SEED_USERS, seedDate } from '../seed/seed.data';
import { SeedService } from '../seed/seed.service';
import { FileStorageService } from '../storage/file-storage.service';
import { Ticket } from '../tickets/ticket.entity';
import { User } from '../users/user.entity';
import {
  CreateTestUserDto,
  ResetResponseDto,
  SeedRequestDto,
  SeedResponseDto,
} from './dto/test-api.dto';

const BCRYPT_COST = 10;
const TEST_TICKET_PREFIX = 'Test ticket ';
// Tables emptied by reset. TRUNCATE (with FK checks off) also restarts the ids at 1.
const RESET_TABLES = ['comments', 'attachments', 'tickets', 'users'];

@Injectable()
export class TestApiService {
  private readonly logger = new Logger(TestApiService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly dataSource: DataSource,
    private readonly seedService: SeedService,
    private readonly storage: FileStorageService,
    @InjectRepository(User) private readonly users: Repository<User>,
    @InjectRepository(Ticket) private readonly tickets: Repository<Ticket>,
    @InjectRepository(Attachment) private readonly attachments: Repository<Attachment>,
  ) {}

  // Wipes the data tables and uploaded files, then re-runs the deterministic seed.
  async reset(): Promise<ResetResponseDto> {
    const dbName = this.config.get<string>('DB_NAME') ?? '';
    if (!dbName.toLowerCase().includes('test')) {
      throw new BadRequestException(
        `Refusing to reset database "${dbName}": its name must contain "test" (use a dedicated test database)`,
      );
    }

    const stored = await this.attachments.find({ select: { path: true } });
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    try {
      await runner.query('SET FOREIGN_KEY_CHECKS = 0');
      for (const table of RESET_TABLES) {
        await runner.query(`TRUNCATE TABLE \`${table}\``);
      }
    } finally {
      await runner.query('SET FOREIGN_KEY_CHECKS = 1');
      await runner.release();
    }
    await this.storage.removeMany(stored.map((attachment) => attachment.path));

    const summary = await this.seedService.run();
    this.logger.warn(`Database "${dbName}" reset and re-seeded`);
    return { ...summary, filesRemoved: stored.length };
  }

  // Adds deterministic extra tickets ("Test ticket N", N continues from the existing ones).
  async seed(dto: SeedRequestDto): Promise<SeedResponseDto> {
    const email = dto.createdBy ?? SEED_USERS[0].email;
    const baseEmails = SEED_USERS.map((user) => user.email);
    const baseCount = await this.users.countBy(baseEmails.map((e) => ({ email: e })));
    const author = await this.users.findOneBy({ email });
    if (baseCount < baseEmails.length || !author) {
      throw new ConflictException(
        'Base users are missing (or createdBy is unknown): call POST /api/test/reset first',
      );
    }

    const count = dto.tickets ?? 5;
    const existing = await this.tickets.countBy({ title: Like(`${TEST_TICKET_PREFIX}%`) });
    const ticketIds: number[] = [];
    for (let i = 1; i <= count; i++) {
      const n = existing + i;
      const saved = await this.tickets.save(
        this.tickets.create({
          title: `${TEST_TICKET_PREFIX}${n}`,
          description: `Deterministic test ticket number ${n}.`,
          status: dto.status ?? TicketStatus.Open,
          priority: dto.priority ?? TicketPriority.Medium,
          tags: [],
          createdById: author.id,
          assigneeId: null,
          createdAt: seedDate(20 + n),
          updatedAt: seedDate(20 + n),
        }),
      );
      ticketIds.push(saved.id);
    }
    return { created: count, ticketIds };
  }

  async createUser(dto: CreateTestUserDto): Promise<UserResponseDto> {
    if (await this.users.existsBy({ email: dto.email })) {
      throw new ConflictException('A user with this email already exists');
    }
    const created = await this.users.save(
      this.users.create({
        email: dto.email,
        passwordHash: await hash(dto.password, BCRYPT_COST),
        role: dto.role ?? UserRole.User,
      }),
    );
    return toUserResponse(await this.users.findOneByOrFail({ id: created.id }));
  }
}
