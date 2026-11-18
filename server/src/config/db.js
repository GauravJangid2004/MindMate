const mongoose = require('mongoose');
const logger = require('../utils/logger');

let cachedPromise = null;

const connectDB = async () => {
  if (mongoose.connection.readyState >= 1) {
    return mongoose.connection;
  }

  if (cachedPromise) {
    return cachedPromise;
  }

  try {
    cachedPromise = mongoose.connect(process.env.MONGODB_URI);
    const conn = await cachedPromise;
    logger.info(`MongoDB connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    cachedPromise = null;
    logger.error(`MongoDB connection error: ${error.message}`);
    if (require.main === module) {
      process.exit(1);
    }
    throw error;
  }
};

module.exports = connectDB;
