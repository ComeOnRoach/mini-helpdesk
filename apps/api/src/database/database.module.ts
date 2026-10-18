import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { buildDataSourceOptions } from './database.config';

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ...buildDataSourceOptions((key) => config.getOrThrow<string>(key)),
        autoLoadEntities: true,
        migrationsRun: true,
      }),
    }),
  ],
})
export class DatabaseModule {}
