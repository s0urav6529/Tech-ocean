/**
 * Rate Limiter Service — Fixed Window Algorithm
 *
 * Algorithm explanation:
 *   - Key pattern : rate_limit:<contact>
 *   - On each request: INCR the key
 *     - If the key is NEW (INCR returns 1), set EXPIRE to WINDOW_SECONDS
 *     - This pins the window to the first request, creating a fixed window
 *   - If current count > MAX → reject with 429
 *   - The window resets automatically when the key expires in Redis
 *
 * Why Redis INCR is atomic:
 *   Redis is single-threaded, making INCR inherently race-condition-free.
 *   No locks are needed for a correct fixed-window counter.
 */

import redisClient from '../config/redis.js';
import { env } from '../config/env.js';

const rateLimitKey = (contact) => `rate_limit:${contact}`;

/**
 * Checks and increments the rate-limit counter for a contact.
 * @param {string} contact
 * @returns {Promise<{allowed: boolean, remaining: number, resetInSeconds: number}>}
 */
export const checkRateLimit = async (contact) => {
    const key = rateLimitKey(contact);

    // Atomic increment
    const count = await redisClient.incr(key);

    if (count === 1) {
        // First request in this window — set the expiry to pin the window
        await redisClient.expire(key, env.RATE_LIMIT.WINDOW_SECONDS);
    }

    const ttl = await redisClient.ttl(key);
    const remaining = Math.max(0, env.RATE_LIMIT.MAX - count);

    return {
        allowed: count <= env.RATE_LIMIT.MAX,
        current: count,
        remaining,
        resetInSeconds: ttl,
    };
};
