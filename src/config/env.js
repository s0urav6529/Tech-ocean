/**
 * Centralised environment configuration.
 * All env vars are read and validated once here;
 * the rest of the app imports from this module only.
 */

import 'dotenv/config';

const required = (key) => {
  const value = process.env[key];
  if (value === undefined || value === null) {
    throw new Error(`[Config] Missing required environment variable: ${key}`);
  }
  return value;
};

const optional = (key, defaultValue) => process.env[key] ?? defaultValue;

export const env = {
  NODE_ENV: optional('NODE_ENV', 'development'),
  PORT: parseInt(optional('PORT', '3000'), 10),

  REDIS: {
    HOST: optional('REDIS_HOST', 'localhost'),
    PORT: parseInt(optional('REDIS_PORT', '6379'), 10),
    PASSWORD: optional('REDIS_PASSWORD', undefined),
  },

  OTP: {
    EXPIRY_SECONDS: parseInt(optional('OTP_EXPIRY_SECONDS', '120'), 10),
    BCRYPT_ROUNDS: parseInt(optional('OTP_BCRYPT_ROUNDS', '10'), 10),
  },

  RATE_LIMIT: {
    MAX: parseInt(optional('RATE_LIMIT_MAX', '3'), 10),
    WINDOW_SECONDS: parseInt(optional('RATE_LIMIT_WINDOW_SECONDS', '300'), 10),
  },
};
