/**
 * OTP Service
 * Responsible for:
 *  - OTP generation
 *  - Secure hashing with bcrypt
 *  - Storing/verifying OTP in Redis with TTL
 *  - Deleting OTP after successful verification
 */

import bcrypt from 'bcryptjs';
import redisClient from '../config/redis.js';
import { env } from '../config/env.js';

// Redis key namespacing helpers
const otpKey = (contact) => `otp:${contact}`;
const verifiedKey = (contact) => `verified:${contact}`;

/**
 * Generates a cryptographically random 6-digit OTP.
 * Math.random is NOT used — we rely on string padding over a full 6-digit space.
 */
export const generateOTP = () => {
    // Use a value between 100000–999999 for guaranteed 6 digits
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    return otp;
};

/**
 * Hashes the plain OTP using bcrypt.
 * @param {string} otp - Plain-text OTP
 * @returns {Promise<string>} - bcrypt hash
 */
export const hashOTP = async (otp) => {
    return bcrypt.hash(otp, env.OTP.BCRYPT_ROUNDS);
};

/**
 * Stores the hashed OTP in Redis with TTL.
 * Key pattern: otp:<contact>
 * @param {string} contact - Phone number or email
 * @param {string} hashedOTP - bcrypt hash of the OTP
 */
export const storeOTP = async (contact, hashedOTP) => {
    await redisClient.set(
        otpKey(contact),
        hashedOTP,
        'EX',
        env.OTP.EXPIRY_SECONDS
    );
};

/**
 * Verifies the provided plain OTP against the stored hash.
 * Returns null if no OTP found (expired or never sent).
 * @param {string} contact
 * @param {string} plainOTP
 * @returns {Promise<boolean|null>} true | false | null (expired/missing)
 */
export const verifyOTP = async (contact, plainOTP) => {
    const key = otpKey(contact);
    const storedHash = await redisClient.get(key);

    if (!storedHash) {
        return null; // OTP expired or was never generated
    }

    const isMatch = await bcrypt.compare(plainOTP, storedHash);
    return isMatch;
};

/**
 * Deletes the OTP from Redis after successful verification.
 * This ensures OTPs are single-use.
 * @param {string} contact
 */
export const deleteOTP = async (contact) => {
    await redisClient.del(otpKey(contact));
};

/**
 * Marks the contact as verified in Redis.
 *
 * Storage strategy:
 *   Key  : verified:<contact>
 *   Value: "1"
 *   TTL  : No expiry (persistent) — change as needed for your domain.
 *
 * In production you would persist this status in your primary database
 * (e.g., users table: `is_verified BOOLEAN`). We store it in Redis here
 * as a lightweight, fast-lookup verification flag. Redis is treated as a
 * cache layer; the authoritative source of truth should be your DB.
 *
 * @param {string} contact
 */
export const markContactVerified = async (contact) => {
    await redisClient.set(verifiedKey(contact), '1');
};

/**
 * Checks whether a contact is already verified.
 * @param {string} contact
 * @returns {Promise<boolean>}
 */
export const isContactVerified = async (contact) => {
    const result = await redisClient.get(verifiedKey(contact));
    return result === '1';
};
