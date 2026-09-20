const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Middleware: Verify JWT token and attach user to request.
 */
const protect = async (req, res, next) => {
  try {
    let token;

    // Extract token from Authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — no token provided',
      });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Attach user to request (exclude sensitive fields)
    const user = await User.findById(decoded.id).select('-phoneHash -__v');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized — user no longer exists',
      });
    }

    req.user = user;
    next();
  } catch (error) {
    logger.warn(`Auth middleware: invalid token — ${error.message}`);
    return res.status(401).json({
      success: false,
      message: 'Not authorized — invalid token',
    });
  }
};

/**
 * Middleware factory: Restrict access to specific user types.
 * Usage: authorize('student')  or  authorize('elder')  or  authorize('student', 'elder')
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized',
      });
    }

    if (!roles.includes(req.user.userType)) {
      return res.status(403).json({
        success: false,
        message: `Role '${req.user.userType}' is not authorized to access this resource`,
      });
    }

    next();
  };
};

/**
 * Generate a JWT token for a user.
 */
const generateToken = (userId) => {
  return jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
};

module.exports = { protect, authorize, generateToken };
