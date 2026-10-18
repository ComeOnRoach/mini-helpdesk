import { config } from 'dotenv';
import { DataSource } from 'typeorm';
import { buildDataSourceOptions } from './database.config';

// Entry point for the TypeORM CLI (migration:generate / run / revert).
// Docker passes variables through the environment; locally they come from the repo-root .env.
config({ path: ['.env', '../../.env'], quiet: true });

function getEnv(key: string): string {
  const value = process.env[key];
  if (value === undefined || value === '') {
    throw new Error(`${key} is required`);
  }
  return value;
}

export default new DataSource(buildDataSourceOptions(getEnv));
