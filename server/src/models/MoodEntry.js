const mongoose = require('mongoose');

const moodEntrySchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    moodValue: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    note: {
      type: String,
      maxlength: 1000,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for time-series queries per user
moodEntrySchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('MoodEntry', moodEntrySchema);
