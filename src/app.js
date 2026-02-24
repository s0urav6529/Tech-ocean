/**
 * Express Application Setup
 * Separate from server.js so that the app can be imported in tests
 * without binding to a port.
 */

import express from 'express';
import morgan from 'morgan';
import otpRoutes from './routes/otp.routes.js';
import { env } from './config/env.js';

const app = express();

// ── Request Parsing ──────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── HTTP Request Logging ─────────────────────────────────────────────────────
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// ── Health Check ─────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
});

// ── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/v1', otpRoutes);

// ── 404 Handler ──────────────────────────────────────────────────────────────
app.use((_req, res) => {
    res.status(404).json({
        success: false,
        message: 'Route not found.',
        timestamp: new Date().toISOString(),
    });
});

// ── Global Error Handler ─────────────────────────────────────────────────────
// Must have 4 parameters for Express to recognise it as an error handler
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
    const statusCode = err.statusCode ?? 500;
    const message =
        statusCode === 500 && env.NODE_ENV === 'production'
            ? 'An unexpected error occurred.'
            : err.message;

    if (statusCode === 500) {
        console.error('[Unhandled Error]', err);
    }

    res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
    });
});

export default app;
