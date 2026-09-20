const jwt = require('jsonwebtoken');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { encrypt, decrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * Initialize Socket.io event handlers for real-time chat.
 */
function initializeChatSocket(io) {
  // ─── Authentication middleware ────────────────────────
  io.use((socket, next) => {
    const token = socket.handshake.auth.token;
    if (!token) {
      return next(new Error('Authentication required'));
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.userId = decoded.id;
      next();
    } catch (error) {
      return next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    logger.info(`Socket connected: user ${socket.userId}`);

    // ─── Join conversation rooms ──────────────────────────
    socket.on('join_conversation', async (conversationId) => {
      try {
        // Verify user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.userId
        );

        if (isParticipant) {
          socket.join(`conversation:${conversationId}`);
          logger.debug(`User ${socket.userId} joined conversation ${conversationId}`);
        }
      } catch (error) {
        logger.error(`Error joining conversation: ${error.message}`);
      }
    });

    // ─── Send message via socket ──────────────────────────
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, content, type = 'text', voiceDuration = 0 } = data;

        if (!conversationId || !content) return;

        // Verify user is a participant
        const conversation = await Conversation.findById(conversationId);
        if (!conversation) return;

        const isParticipant = conversation.participants.some(
          (p) => p.toString() === socket.userId
        );
        if (!isParticipant) return;

        // Encrypt and save message
        const encryptedContent = encrypt(content);

        const message = await Message.create({
          conversationId,
          senderId: socket.userId,
          content: encryptedContent,
          type,
          voiceDuration,
          isEncrypted: true,
        });

        // Update conversation
        conversation.lastMessage = encrypt(
          content.length > 100 ? content.substring(0, 100) + '...' : content
        );
        conversation.lastMessageAt = new Date();
        await conversation.save();

        // Populate sender info
        await message.populate('senderId', 'anonymousHandle userType');

        // Broadcast decrypted message to all participants in the room
        const broadcastMessage = message.toObject();
        broadcastMessage.content = content;

        io.to(`conversation:${conversationId}`).emit('new_message', broadcastMessage);
      } catch (error) {
        logger.error(`Error sending socket message: ${error.message}`);
      }
    });

    // ─── Typing indicators ────────────────────────────────
    socket.on('typing', (conversationId) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit('user_typing', { userId: socket.userId, conversationId });
    });

    socket.on('stop_typing', (conversationId) => {
      socket
        .to(`conversation:${conversationId}`)
        .emit('user_stop_typing', { userId: socket.userId, conversationId });
    });

    // ─── Leave conversation ───────────────────────────────
    socket.on('leave_conversation', (conversationId) => {
      socket.leave(`conversation:${conversationId}`);
    });

    // ─── Disconnect ───────────────────────────────────────
    socket.on('disconnect', () => {
      logger.info(`Socket disconnected: user ${socket.userId}`);
    });
  });
}

module.exports = initializeChatSocket;
