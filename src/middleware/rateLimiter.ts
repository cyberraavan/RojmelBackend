import rateLimit from 'express-rate-limit';

export const loginRateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 5, // Limit each IP to 5 login requests per windowMs
    message: {
        success: false,
        message: 'Too many login attempts. Please try again later.',
    },
    standardHeaders: true,
    legacyHeaders: false,
});

