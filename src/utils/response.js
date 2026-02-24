/**
 * Response helpers — keep controller return shapes consistent.
 */

/**
 * Send a successful JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 * @param {object} [data]
 */
export const sendSuccess = (res, statusCode, message, data = {}) => {
    res.status(statusCode).json({
        success: true,
        message,
        ...(Object.keys(data).length > 0 && { data }),
        timestamp: new Date().toISOString(),
    });
};

/**
 * Send an error JSON response.
 * @param {import('express').Response} res
 * @param {number} statusCode
 * @param {string} message
 */
export const sendError = (res, statusCode, message) => {
    res.status(statusCode).json({
        success: false,
        message,
        timestamp: new Date().toISOString(),
    });
};
