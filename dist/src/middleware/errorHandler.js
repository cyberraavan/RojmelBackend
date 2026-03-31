"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.AppError = void 0;
const zod_1 = require("zod");
class AppError extends Error {
    statusCode;
    details;
    constructor(message, statusCode = 500, details) {
        super(message);
        this.statusCode = statusCode;
        this.details = details;
    }
}
exports.AppError = AppError;
const errorHandler = (err, req, res, next) => {
    // Fallback if headers already sent
    if (res.headersSent) {
        next(err);
        return;
    }
    console.error(err);
    if (err instanceof AppError) {
        res.status(err.statusCode).json({
            success: false,
            message: err.message,
            ...(err.details ? { errors: err.details } : {}),
        });
        return;
    }
    if (err instanceof zod_1.ZodError) {
        res.status(400).json({
            success: false,
            message: 'Invalid request data',
            errors: err.issues,
        });
        return;
    }
    res.status(500).json({
        success: false,
        message: 'Internal server error',
    });
};
exports.errorHandler = errorHandler;
