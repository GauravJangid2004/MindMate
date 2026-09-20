const rateLimit = require('express-rate-limit');

/**
 * Global API rate limiter — 100 requests per 15 minutes per IP.
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * Auth route rate limiter — 10 attempts per 15 minutes per IP.
 * Protects against brute-force login/registration attacks.
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    success: false,
    message: 'Too many auth attempts, please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

/**
 * OTP rate limiter — 5 OTP requests per 5 minutes per IP.
 * Prevents OTP flooding / SMS abuse.
 */
const otpLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  max: 5,
  message: {
    success: false,
    message: 'Too many OTP requests, please wait before trying again.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

module.exports = { globalLimiter, authLimiter, otpLimiter };
