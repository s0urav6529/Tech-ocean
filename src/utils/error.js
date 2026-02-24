/**
 * Centralised error factory.
 * Creates a plain Error-like object with an HTTP status code attached.
 * This keeps controllers clean — they just call next(createError(status, msg)).
 *
 * @param {number} statusCode - HTTP status code
 * @param {string} message    - Human-readable error message
 * @returns {Error}
 */
export const createError = (statusCode, message) => {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
};
