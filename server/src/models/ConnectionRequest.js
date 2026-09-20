const mongoose = require('mongoose');

const connectionRequestSchema = new mongoose.Schema(
  {
    studentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    mentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Index for mentor to fetch their pending requests
connectionRequestSchema.index({ mentorId: 1, status: 1 });
// Prevent duplicate pending requests from same student to same mentor
connectionRequestSchema.index(
  { studentId: 1, mentorId: 1 },
  {
    unique: true,
    partialFilterExpression: { status: 'pending' },
  }
);

module.exports = mongoose.model('ConnectionRequest', connectionRequestSchema);
