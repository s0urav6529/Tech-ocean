/**
 * Server Entry Point
 * Connects to Redis, then starts the HTTP server.
 * Handles graceful shutdown on SIGTERM / SIGINT.
 */

import redisClient from './config/redis.js';
import { env } from './config/env.js';
import app from './app.js';

const startServer = async () => {
    // 1. Connect to Redis before accepting requests
    try {
        await redisClient.connect();
    } catch (err) {
        console.error('[Startup] Failed to connect to Redis:', err.message);
        process.exit(1);
    }

    // 2. Start HTTP server
    const server = app.listen(env.PORT, () => {
        console.log(`[Server] Running in ${env.NODE_ENV} mode on port ${env.PORT}`);
        console.log(`[Server] Health: http://localhost:${env.PORT}/health`);
    });

    // 3. Graceful shutdown
    const shutdown = async (signal) => {
        console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);

        server.close(async () => {
            console.log('[Server] HTTP server closed.');
            try {
                await redisClient.quit();
                console.log('[Redis] Connection closed cleanly.');
            } catch (err) {
                console.error('[Redis] Error during shutdown:', err.message);
            }
            process.exit(0);
        });
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // 4. Catch unhandled rejections
    process.on('unhandledRejection', (reason) => {
        console.error('[Process] Unhandled Promise Rejection:', reason);
        process.exit(1);
    });
};

startServer();
