const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    // Content is encrypted at rest via the controller layer
    content: {
      type: String,
      default: '',
    },
    type: {
      type: String,
      enum: ['text', 'voice'],
      default: 'text',
    },
    voiceDuration: {
      type: Number,
      default: 0,
    },
    isEncrypted: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fetching messages in a conversation chronologically
messageSchema.index({ conversationId: 1, createdAt: 1 });

module.exports = mongoose.model('Message', messageSchema);
