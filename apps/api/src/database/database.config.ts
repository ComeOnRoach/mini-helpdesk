import { join } from 'node:path';
import type { DataSourceOptions } from 'typeorm';

// Shared by the Nest module and the TypeORM CLI (data-source.ts) so they cannot drift apart.
// Globs resolve to src/ under ts-node and to dist/ after `nest build`.
export function buildDataSourceOptions(get: (key: string) => string): DataSourceOptions {
  return {
    type: 'mysql',
    host: get('DB_HOST'),
    port: Number(get('DB_PORT')),
    username: get('DB_USER'),
    password: get('DB_PASSWORD'),
    database: get('DB_NAME'),
    charset: 'utf8mb4',
    entities: [join(__dirname, '..', '**', '*.entity.{ts,js}')],
    migrations: [join(__dirname, '..', 'migrations', '*.{ts,js}')],
    synchronize: false,
  };
}
