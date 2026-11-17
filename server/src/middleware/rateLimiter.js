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

const AUTH_WINDOW_MS = 15 * 60 * 1000;
const AUTH_MAX = process.env.NODE_ENV === 'production' ? 10 : 30;

function createAuthLimiter(action, max = AUTH_MAX) {
  return rateLimit({
    windowMs: AUTH_WINDOW_MS,
    max,
    message: {
      success: false,
      message: `Too many ${action} attempts. Please wait 15 minutes before trying again.`,
    },
    standardHeaders: true,
    legacyHeaders: false,
  });
}

// Keep counters independent: checking a phone or completing OTP must not
// consume the registration or login attempt allowance for the same IP.
const checkPhoneLimiter = createAuthLimiter('phone check');
const verifyOtpLimiter = createAuthLimiter('OTP verification', 10);
const registerLimiter = createAuthLimiter('registration');
const loginLimiter = createAuthLimiter('login', 10);

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

module.exports = {
  globalLimiter,
  checkPhoneLimiter,
  verifyOtpLimiter,
  registerLimiter,
  loginLimiter,
  otpLimiter,
};
