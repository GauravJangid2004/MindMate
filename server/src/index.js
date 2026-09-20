require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const hpp = require('hpp');

const connectDB = require('./config/db');
const logger = require('./utils/logger');
const errorHandler = require('./middleware/errorHandler');
const { globalLimiter } = require('./middleware/rateLimiter');
const initializeChatSocket = require('./socket/chatHandler');

// ─── Route imports ──────────────────────────────────────
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const connectionRoutes = require('./routes/connections');
const chatRoutes = require('./routes/chat');
const diaryRoutes = require('./routes/diary');
const moodRoutes = require('./routes/mood');
const communityRoutes = require('./routes/community');

// ─── App Setup ──────────────────────────────────────────
const app = express();
const server = http.createServer(app);

// ─── Socket.io ──────────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// ─── Security Middleware ────────────────────────────────
// Set security HTTP headers
app.use(helmet());

// Enable CORS
app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
    credentials: true,
  })
);

// Rate limiting
app.use('/api', globalLimiter);

// Body parsing (limit payload size)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Sanitize data against NoSQL injection
app.use(mongoSanitize());

// Prevent HTTP parameter pollution
app.use(hpp());

// ─── API Routes ─────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/connections', connectionRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/diary', diaryRoutes);
app.use('/api/mood', moodRoutes);
app.use('/api/community', communityRoutes);

// ─── Health Check ───────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'MindMate API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
  });
});

// ─── 404 Handler ────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.originalUrl} not found`,
  });
});

// ─── Error Handler (must be last) ───────────────────────
app.use(errorHandler);

// ─── Initialize Socket.io Chat ──────────────────────────
initializeChatSocket(io);

// ─── Start Server ───────────────────────────────────────
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    server.listen(PORT, () => {
      logger.info(`🚀 MindMate API running on port ${PORT} [${process.env.NODE_ENV}]`);
      logger.info(`📡 Socket.io ready for real-time chat`);
      logger.info(`🔗 Health check: http://localhost:${PORT}/api/health`);
    });
  } catch (error) {
    logger.error(`Failed to start server: ${error.message}`);
    process.exit(1);
  }
};

startServer();

// ─── Graceful Shutdown ──────────────────────────────────
process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
});

process.on('unhandledRejection', (err) => {
  logger.error(`Unhandled Rejection: ${err.message}`);
  server.close(() => process.exit(1));
});
