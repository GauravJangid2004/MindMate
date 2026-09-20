const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const { encrypt, decrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * @desc    Get all conversations for the current user
 * @route   GET /api/chat/conversations
 */
const getConversations = async (req, res, next) => {
  try {
    const conversations = await Conversation.find({
      participants: req.user._id,
    })
      .populate('participants', 'anonymousHandle userType gender')
      .sort({ lastMessageAt: -1 });

    // Decrypt last message previews
    const decryptedConversations = conversations.map((conv) => {
      const obj = conv.toObject();
      if (obj.lastMessage) {
        try {
          obj.lastMessage = decrypt(obj.lastMessage);
        } catch {
          obj.lastMessage = '[encrypted message]';
        }
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      data: { conversations: decryptedConversations },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get messages for a conversation (paginated)
 * @route   GET /api/chat/:conversationId/messages
 */
const getMessages = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    // Verify user is part of this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation',
      });
    }

    const messages = await Message.find({ conversationId })
      .populate('senderId', 'anonymousHandle userType')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Message.countDocuments({ conversationId });

    // Decrypt message content
    const decryptedMessages = messages.map((msg) => {
      const obj = msg.toObject();
      if (obj.isEncrypted && obj.content) {
        try {
          obj.content = decrypt(obj.content);
        } catch {
          obj.content = '[could not decrypt]';
        }
      }
      return obj;
    });

    // Reverse to chronological order
    decryptedMessages.reverse();

    res.status(200).json({
      success: true,
      data: {
        messages: decryptedMessages,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Send a message in a conversation
 * @route   POST /api/chat/:conversationId/messages
 */
const sendMessage = async (req, res, next) => {
  try {
    const { conversationId } = req.params;
    const { content, type = 'text', voiceDuration = 0 } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message content is required',
      });
    }

    // Verify user is part of this conversation
    const conversation = await Conversation.findById(conversationId);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: 'Conversation not found',
      });
    }

    const isParticipant = conversation.participants.some(
      (p) => p.toString() === req.user._id.toString()
    );
    if (!isParticipant) {
      return res.status(403).json({
        success: false,
        message: 'You are not part of this conversation',
      });
    }

    // Encrypt message content
    const encryptedContent = encrypt(content);

    const message = await Message.create({
      conversationId,
      senderId: req.user._id,
      content: encryptedContent,
      type,
      voiceDuration,
      isEncrypted: true,
    });

    // Update conversation's last message
    conversation.lastMessage = encrypt(
      content.length > 100 ? content.substring(0, 100) + '...' : content
    );
    conversation.lastMessageAt = new Date();
    await conversation.save();

    // Populate sender info for response
    await message.populate('senderId', 'anonymousHandle userType');

    // Return the decrypted message for immediate display
    const responseMessage = message.toObject();
    responseMessage.content = content;

    res.status(201).json({
      success: true,
      data: { message: responseMessage },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getConversations, getMessages, sendMessage };
