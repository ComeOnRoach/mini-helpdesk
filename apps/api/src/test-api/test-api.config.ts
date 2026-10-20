import { config as loadDotenv } from 'dotenv';

// The Test API exists only in test setups. NODE_ENV=production always wins: ENABLE_TEST_API is ignored there.
// Read at import time (it decides which modules are registered), so the .env files are loaded here first;
// variables already in the process environment keep priority.
export function isTestApiEnabled(): boolean {
  loadDotenv({ path: ['.env', '../../.env'], quiet: true });
  const env = process.env;
  if (env.NODE_ENV === 'production') return false;
  return env.NODE_ENV === 'test' || env.ENABLE_TEST_API === 'true';
}
