/**
 * Request Validation Middleware
 * Uses a simple schema-based approach (no heavy libs like Joi/Zod)
 * to keep dependencies lean. Swap with Zod/Joi in larger projects.
 */

import { createError } from '../utils/error.js';

/**
 * Validates the /signup request body.
 * Accepts a numeric phone number or an email address.
 */
export const validateSignup = (req, res, next) => {
    const { contact } = req.body;

    if (!contact || typeof contact !== 'string' || contact.trim() === '') {
        return next(createError(400, '`contact` is required and must be a non-empty string.'));
    }

    const trimmed = contact.trim();

    const isPhone = /^\+?[1-9]\d{6,14}$/.test(trimmed);   // E.164-ish format
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);

    if (!isPhone && !isEmail) {
        return next(createError(400, '`contact` must be a valid phone number or email address.'));
    }

    req.body.contact = trimmed; // Normalise (trimmed)
    next();
};

/**
 * Validates the /verify-otp request body.
 */
export const validateVerifyOTP = (req, res, next) => {
    const { contact, otp } = req.body;

    if (!contact || typeof contact !== 'string' || contact.trim() === '') {
        return next(createError(400, '`contact` is required.'));
    }

    if (!otp || typeof otp !== 'string' || !/^\d{6}$/.test(otp.trim())) {
        return next(createError(400, '`otp` must be a 6-digit numeric string.'));
    }

    req.body.contact = contact.trim();
    req.body.otp = otp.trim();
    next();
};
