const mongoose = require('mongoose');

const emergencyContactSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    relationship: {
      type: String,
      trim: true,
      maxlength: 50,
      default: '',
    },
    phone: {
      type: String,
      required: true,
      trim: true,
      maxlength: 30,
    },
  },
  { timestamps: true }
);

emergencyContactSchema.index({ userId: 1, createdAt: -1 });

module.exports = mongoose.model('EmergencyContact', emergencyContactSchema);
