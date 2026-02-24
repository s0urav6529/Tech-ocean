/**
 * Redis client singleton using ioredis.
 * Exported as a shared instance so the connection pool
 * is reused across the entire application.
 */

import Redis from 'ioredis';
import { env } from './env.js';

const redisOptions = {
    host: env.REDIS.HOST,
    port: env.REDIS.PORT,
    ...(env.REDIS.PASSWORD && { password: env.REDIS.PASSWORD }),
    lazyConnect: true,          // Connect only when first command is issued
    retryStrategy: (times) => {
        if (times > 5) {
            console.error(`[Redis] Could not connect after ${times} attempts. Giving up.`);
            return null;            // Stop retrying
        }
        const delay = Math.min(times * 200, 2000);
        console.warn(`[Redis] Reconnecting in ${delay}ms... (attempt ${times})`);
        return delay;
    },
    enableReadyCheck: true,
};

const redisClient = new Redis(redisOptions);

redisClient.on('connect', () => console.log('[Redis] Connected successfully'));
redisClient.on('error', (err) => console.error('[Redis] Error:', err.message));
redisClient.on('close', () => console.warn('[Redis] Connection closed'));

export default redisClient;
