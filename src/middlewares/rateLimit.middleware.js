/**
 * Rate Limiting Middleware
 *
 * Reads `contact` from the request body and applies the fixed-window
 * rate limiter against it before the request reaches the controller.
 *
 * Sets informative headers so clients can implement exponential back-off:
 *   X-RateLimit-Limit     : Max allowed requests per window
 *   X-RateLimit-Remaining : Remaining requests in current window
 *   X-RateLimit-Reset     : Seconds until the window resets
 *   Retry-After           : (on 429) Seconds to wait before retrying
 */

import { checkRateLimit } from '../services/rateLimiter.service.js';
import { env } from '../config/env.js';
import { createError } from '../utils/error.js';

export const rateLimitMiddleware = async (req, res, next) => {
    try {
        const { contact } = req.body;

        if (!contact) {
            // Let the controller handle missing field validation
            return next();
        }

        const limitResult = await checkRateLimit(contact);

        // Add rate-limit headers to every response
        res.set({
            'X-RateLimit-Limit': env.RATE_LIMIT.MAX,
            'X-RateLimit-Remaining': limitResult.remaining,
            'X-RateLimit-Reset': limitResult.resetInSeconds,
        });

        if (!limitResult.allowed) {
            res.set('Retry-After', limitResult.resetInSeconds);
            return next(
                createError(
                    429,
                    `Too many OTP requests. Please try again in ${limitResult.resetInSeconds} seconds.`
                )
            );
        }

        next();
    } catch (err) {
        next(err);
    }
};
