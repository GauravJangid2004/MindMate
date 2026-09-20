const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const { authLimiter, otpLimiter } = require('../middleware/rateLimiter');
const {
  sendOTP,
  verifyOTP,
  register,
  login,
  getMe,
} = require('../controllers/authController');

const router = express.Router();

// ─── Send OTP ──────────────────────────────────────────
router.post(
  '/send-otp',
  otpLimiter,
  [
    body('phone')
      .trim()
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone must be exactly 10 digits')
      .isNumeric()
      .withMessage('Phone must contain only digits'),
  ],
  validate,
  sendOTP
);

// ─── Verify OTP ────────────────────────────────────────
router.post(
  '/verify-otp',
  authLimiter,
  [
    body('phone').trim().isLength({ min: 10, max: 10 }).isNumeric(),
    body('otp')
      .trim()
      .isLength({ min: 6, max: 6 })
      .withMessage('OTP must be 6 digits')
      .isNumeric(),
  ],
  validate,
  verifyOTP
);

// ─── Register ──────────────────────────────────────────
router.post(
  '/register',
  authLimiter,
  [
    body('phone').trim().isLength({ min: 10, max: 10 }).isNumeric(),
    body('zkCommitment')
      .trim()
      .isLength({ min: 64, max: 64 })
      .withMessage('zkCommitment must be a 64-character hex string'),
    body('anonymousHandle')
      .trim()
      .notEmpty()
      .withMessage('anonymousHandle is required'),
    body('userType')
      .isIn(['student', 'elder'])
      .withMessage('userType must be "student" or "elder"'),
  ],
  validate,
  register
);

// ─── Login ─────────────────────────────────────────────
router.post(
  '/login',
  authLimiter,
  [
    body('phone').trim().isLength({ min: 10, max: 10 }).isNumeric(),
    body('zkCommitment')
      .trim()
      .isLength({ min: 64, max: 64 })
      .withMessage('zkCommitment must be a 64-character hex string'),
  ],
  validate,
  login
);

// ─── Get current user ──────────────────────────────────
router.get('/me', protect, getMe);

module.exports = router;
