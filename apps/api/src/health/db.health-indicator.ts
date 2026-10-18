import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HealthIndicatorService } from '@nestjs/terminus';
import { createConnection } from 'mysql2/promise';

// Temporary: replaced by TypeOrmHealthIndicator once TypeORM arrives (T1.1).
@Injectable()
export class DbHealthIndicator {
  constructor(
    private readonly config: ConfigService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  isHealthy(key: string) {
    return this.healthIndicatorService
      .check(key)
      .attempt(async () => {
        const connection = await createConnection({
          host: this.config.getOrThrow<string>('DB_HOST'),
          port: Number(this.config.getOrThrow<string>('DB_PORT')),
          user: this.config.getOrThrow<string>('DB_USER'),
          password: this.config.getOrThrow<string>('DB_PASSWORD'),
          database: this.config.getOrThrow<string>('DB_NAME'),
          connectTimeout: 2000,
        });
        try {
          await connection.query('SELECT 1');
        } finally {
          await connection.end();
        }
      })
      .withTimeout(3000);
  }
}
