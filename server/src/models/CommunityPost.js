const mongoose = require('mongoose');

const communityPostSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    title: {
      type: String,
      required: true,
      maxlength: 200,
    },
    content: {
      type: String,
      required: true,
      maxlength: 5000,
    },
    category: {
      type: String,
      enum: [
        'Academic Stress',
        'Loneliness',
        'Mental Health',
        'Career',
        'Relationships',
        'General',
      ],
      default: 'General',
    },
    heartedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
    heartCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for reverse-chronological listing
communityPostSchema.index({ createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
