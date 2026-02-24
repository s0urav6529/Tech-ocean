/**
 * OTP Routes
 *
 * POST /signup      → [validate] → [rate-limit] → [signup controller]
 * POST /verify-otp  → [validate] → [verifyOtp controller]
 */

import { Router } from 'express';
import { signup, verifyOtp } from '../controllers/otp.controller.js';
import { rateLimitMiddleware } from '../middlewares/rateLimit.middleware.js';
import { validateSignup, validateVerifyOTP } from '../middlewares/validate.middleware.js';

const router = Router();

/**
 * @route   POST /signup
 * @desc    Generate and send OTP to the given contact
 * @access  Public
 */
router.post('/signup', validateSignup, rateLimitMiddleware, signup);

/**
 * @route   POST /verify-otp
 * @desc    Verify the OTP submitted by the user
 * @access  Public
 */
router.post('/verify-otp', validateVerifyOTP, verifyOtp);

export default router;
