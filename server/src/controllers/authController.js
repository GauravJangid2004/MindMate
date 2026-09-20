const User = require('../models/User');
const { generateToken } = require('../middleware/auth');
const { generateOTP } = require('../utils/crypto');
const logger = require('../utils/logger');

// In-memory OTP store (in production, use Redis with TTL)
const otpStore = new Map();

/**
 * @desc    Send OTP to phone number (sandbox — returns OTP in response)
 * @route   POST /api/auth/send-otp
 */
const sendOTP = async (req, res, next) => {
  try {
    const { phone } = req.body;

    if (!phone || !/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid 10-digit phone number',
      });
    }

    const otp = generateOTP();

    // Store OTP with 5 minute expiry
    otpStore.set(phone, {
      otp,
      expiresAt: Date.now() + 5 * 60 * 1000,
      attempts: 0,
    });

    logger.info(`OTP generated for phone ending in ...${phone.slice(-4)}`);

    // In sandbox mode, return the OTP in the response
    // In production, send via SMS provider (Twilio / MSG91)
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      // Remove this in production:
      sandbox: { otp },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Verify OTP
 * @route   POST /api/auth/verify-otp
 */
const verifyOTP = async (req, res, next) => {
  try {
    const { phone, otp } = req.body;

    if (!phone || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Phone and OTP are required',
      });
    }

    const stored = otpStore.get(phone);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'No OTP found for this number. Please request a new one.',
      });
    }

    // Check expiry
    if (Date.now() > stored.expiresAt) {
      otpStore.delete(phone);
      return res.status(400).json({
        success: false,
        message: 'OTP has expired. Please request a new one.',
      });
    }

    // Check attempts (max 5)
    if (stored.attempts >= 5) {
      otpStore.delete(phone);
      return res.status(429).json({
        success: false,
        message: 'Too many failed attempts. Please request a new OTP.',
      });
    }

    // Verify OTP
    if (stored.otp !== otp) {
      stored.attempts += 1;
      return res.status(400).json({
        success: false,
        message: 'Incorrect OTP. Please try again.',
      });
    }

    // OTP verified — mark as verified but keep for registration step
    otpStore.set(phone, { ...stored, verified: true });

    logger.info(`OTP verified for phone ending in ...${phone.slice(-4)}`);

    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Register a new user
 * @route   POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { phone, zkCommitment, anonymousHandle, userType, profile } =
      req.body;

    // Validate phone was verified via OTP
    const storedOTP = otpStore.get(phone);
    if (!storedOTP || !storedOTP.verified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be verified via OTP first',
      });
    }

    // Validate required fields
    if (!zkCommitment || !anonymousHandle || !userType) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: zkCommitment, anonymousHandle, userType',
      });
    }

    if (!['student', 'elder'].includes(userType)) {
      return res.status(400).json({
        success: false,
        message: 'userType must be either "student" or "elder"',
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ zkCommitment });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'An account with this identity already exists. Please sign in.',
      });
    }

    // Hash phone number before storing
    const phoneHash = await User.hashPhone(phone);

    // Build user data
    const userData = {
      phoneHash,
      zkCommitment,
      anonymousHandle,
      userType,
      isVerified: true,
    };

    // Add role-specific profile data
    if (userType === 'student' && profile) {
      userData.age = profile.age;
      userData.gender = profile.gender;
      userData.course = profile.course;
      userData.hobbies = profile.hobbies || [];
    } else if (userType === 'elder' && profile) {
      userData.gender = profile.gender;
      userData.passion = profile.passion;
      userData.hobbies = profile.hobbies || [];
    }

    const user = await User.create(userData);

    // Clean up OTP store
    otpStore.delete(phone);

    // Generate JWT
    const token = generateToken(user._id);

    logger.info(`New ${userType} registered: ${anonymousHandle}`);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: {
        token,
        user: user.toSafeJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Login an existing user
 * @route   POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { phone, zkCommitment } = req.body;

    if (!phone || !zkCommitment) {
      return res.status(400).json({
        success: false,
        message: 'Phone and zkCommitment are required',
      });
    }

    // Validate phone was verified via OTP
    const storedOTP = otpStore.get(phone);
    if (!storedOTP || !storedOTP.verified) {
      return res.status(400).json({
        success: false,
        message: 'Phone number must be verified via OTP first',
      });
    }

    // Find user by zkCommitment
    const user = await User.findOne({ zkCommitment });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials — no account found',
      });
    }

    // Verify phone matches
    const phoneMatches = await user.comparePhone(phone);
    if (!phoneMatches) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials',
      });
    }

    // Clean up OTP store
    otpStore.delete(phone);

    // Generate JWT
    const token = generateToken(user._id);

    logger.info(`User logged in: ${user.anonymousHandle}`);

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        user: user.toSafeJSON(),
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get current user's info (token validation)
 * @route   GET /api/auth/me
 */
const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: { user: req.user.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { sendOTP, verifyOTP, register, login, getMe };
