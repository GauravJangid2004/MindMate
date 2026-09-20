const mongoose = require('mongoose');

const diaryEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    // Content is encrypted at rest via the controller layer
    content: {
      type: String,
      required: true,
    },
    mood: {
      type: String,
      enum: ['happy', 'sad', 'neutral', 'grateful'],
      default: 'neutral',
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

// Compound index for fetching a user's entries in reverse chronological order
diaryEntrySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('DiaryEntry', diaryEntrySchema);
