/**
 * OTP Controller
 *
 * Handles:
 *   POST /signup      — Generate and store OTP
 *   POST /verify-otp  — Verify OTP and mark contact as verified
 */

import {
    generateOTP,
    hashOTP,
    storeOTP,
    verifyOTP,
    deleteOTP,
    markContactVerified,
    isContactVerified,
} from '../services/otp.service.js';
import { sendSuccess } from '../utils/response.js';
import { createError } from '../utils/error.js';
import { env } from '../config/env.js';

/**
 * POST /signup
 * 1. Generate a 6-digit OTP
 * 2. Hash it with bcrypt
 * 3. Store in Redis with TTL
 *
 * Rate-limit enforcement is done by rateLimitMiddleware BEFORE this runs.
 */
export const signup = async (req, res, next) => {
    try {
        const { contact } = req.body;

        // Check if contact is already verified
        const alreadyVerified = await isContactVerified(contact);
        if (alreadyVerified) {
            return next(createError(409, 'This contact is already verified.'));
        }

        const otp = generateOTP();
        const hashedOTP = await hashOTP(otp);
        await storeOTP(contact, hashedOTP);

        // In production: dispatch OTP via SMS/Email provider (e.g., Twilio, SendGrid)
        // We return the OTP in response ONLY for local development
        const responseData =
            env.NODE_ENV === 'development'
                ? { otp: otp, expiresInSeconds: env.OTP.EXPIRY_SECONDS }
                : { expiresInSeconds: env.OTP.EXPIRY_SECONDS };
        return sendSuccess(res, 200, 'OTP sent successfully.', responseData);
    } catch (err) {
        next(err);
    }
};

/**
 * POST /verify-otp
 * 1. Retrieve hashed OTP from Redis (TTL enforced by Redis itself)
 * 2. Compare plain OTP with bcrypt
 * 3. On success: mark contact verified + delete OTP (single-use)
 * 4. On failure: return 401
 */
export const verifyOtp = async (req, res, next) => {
    try {
        const { contact, otp } = req.body;

        const result = await verifyOTP(contact, otp);

        if (result === null) {
            // Key missing from Redis → OTP expired or never generated
            return next(createError(410, 'OTP has expired or was never issued. Please request a new OTP.'));
        }

        if (!result) {
            return next(createError(401, 'Invalid OTP. Please check and try again.'));
        }

        // OTP is valid — single-use: delete it immediately
        await deleteOTP(contact);

        // Persist verification status
        await markContactVerified(contact);

        return sendSuccess(res, 200, 'Contact verified successfully.', { contact, verified: true });
    } catch (err) {
        next(err);
    }
};
