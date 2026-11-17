const express = require('express');
const { body } = require('express-validator');
const validate = require('../middleware/validate');
const { protect } = require('../middleware/auth');
const {
  checkPhoneLimiter,
  verifyOtpLimiter,
  registerLimiter,
  loginLimiter,
  otpLimiter,
} = require('../middleware/rateLimiter');
const {
  checkPhone,
  sendOTP,
  verifyOTP,
  register,
  login,
  getMe,
} = require('../controllers/authController');

const router = express.Router();

// ─── Check phone registration ─────────────────────────
router.post(
  '/check-phone',
  checkPhoneLimiter,
  [
    body('phone')
      .trim()
      .isLength({ min: 10, max: 10 })
      .withMessage('Phone must be exactly 10 digits')
      .isNumeric()
      .withMessage('Phone must contain only digits'),
  ],
  validate,
  checkPhone
);

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
  verifyOtpLimiter,
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
  registerLimiter,
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
  loginLimiter,
  [
    body('phone').trim().isLength({ min: 10, max: 10 }).isNumeric(),
    body('zkCommitment')
      .optional({ checkFalsy: true })
      .trim()
      .isLength({ min: 64, max: 64 })
      .withMessage('zkCommitment must be a 64-character hex string'),
    body('userType')
      .optional()
      .isIn(['student', 'elder'])
      .withMessage('userType must be "student" or "elder"'),
  ],
  validate,
  login
);

// ─── Get current user ──────────────────────────────────
router.get('/me', protect, getMe);

module.exports = router;
