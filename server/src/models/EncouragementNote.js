const mongoose = require('mongoose');

const encouragementNoteSchema = new mongoose.Schema(
  {
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    message: {
      type: String,
      required: true,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

encouragementNoteSchema.index({ createdAt: -1 });

module.exports = mongoose.model('EncouragementNote', encouragementNoteSchema);
