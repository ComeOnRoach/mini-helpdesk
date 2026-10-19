const REQUIRED = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME', 'JWT_SECRET'] as const;

const NODE_ENVS = ['development', 'test', 'production'];

export function validateEnv(config: Record<string, unknown>): Record<string, unknown> {
  const errors: string[] = [];

  for (const key of REQUIRED) {
    const value = config[key];
    if (typeof value !== 'string' || value.trim() === '') {
      errors.push(`${key} is required`);
    }
  }

  const port = Number(config.DB_PORT);
  if (!Number.isInteger(port) || port < 1 || port > 65535) {
    errors.push('DB_PORT must be an integer between 1 and 65535');
  }

  const nodeEnv = config.NODE_ENV ?? 'development';
  if (typeof nodeEnv !== 'string' || !NODE_ENVS.includes(nodeEnv)) {
    errors.push(`NODE_ENV must be one of: ${NODE_ENVS.join(', ')}`);
  }

  const expires = config.JWT_EXPIRES_IN;
  if (
    expires !== undefined &&
    (typeof expires !== 'string' || !/^\d+(ms|s|m|h|d|w|y)?$/.test(expires))
  ) {
    errors.push('JWT_EXPIRES_IN must look like 15m, 1h or 7d');
  }

  const maxUpload = config.MAX_UPLOAD_BYTES;
  if (maxUpload !== undefined && maxUpload !== '' && !/^[1-9]\d*$/.test(String(maxUpload))) {
    errors.push('MAX_UPLOAD_BYTES must be a positive integer (bytes)');
  }

  if (errors.length > 0) {
    throw new Error(`Invalid environment configuration:\n - ${errors.join('\n - ')}`);
  }

  return config;
}
