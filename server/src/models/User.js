const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const userSchema = new mongoose.Schema(
  {
    // ─── Identity (anonymous) ──────────────────────────
    phoneHash: {
      type: String,
      required: true,
      unique: true,
    },
    // Deterministic, server-secret-backed lookup key. The raw phone number is
    // never persisted and this field is not returned to clients.
    phoneLookup: {
      type: String,
      unique: true,
      sparse: true,
      select: false,
    },
    zkCommitment: {
      type: String,
      required: true,
      unique: true,
    },
    anonymousHandle: {
      type: String,
      required: true,
      unique: true,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },

    // ─── Role ──────────────────────────────────────────
    userType: {
      type: String,
      enum: ['student', 'elder'],
      required: true,
    },

    // ─── Student-specific fields ───────────────────────
    age: {
      type: Number,
      min: 15,
      max: 100,
    },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },
    course: String,
    hobbies: [String],
    connectedMentorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },

    // ─── Elder-specific fields ─────────────────────────
    passion: String,
    // gender + hobbies are shared with student schema

    // ─── Preferences ───────────────────────────────────
    preferences: {
      fontSize: {
        type: String,
        enum: ['small', 'medium', 'large', 'xlarge'],
        default: 'medium',
      },
      notifications: { type: Boolean, default: true },
      autoSave: { type: Boolean, default: true },
    },

    // ─── Nickname (optional, not real name) ────────────
    nickname: {
      type: String,
      default: 'Anonymous User',
      maxlength: 50,
    },
  },
  {
    timestamps: true,
  }
);

// Index for fast lookups
userSchema.index({ userType: 1 });
userSchema.index({ connectedMentorId: 1 });

/**
 * Hash a phone number with bcrypt for storage.
 * We use this as a static method since the raw phone
 * is never persisted — only the hash.
 */
userSchema.statics.hashPhone = async function (rawPhone) {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(rawPhone, salt);
};

/**
 * Create a deterministic lookup key without storing the raw phone number.
 * A server secret prevents a simple rainbow-table lookup of 10-digit phones.
 */
userSchema.statics.createPhoneLookup = function (rawPhone) {
  const secret = process.env.PHONE_LOOKUP_SECRET || process.env.JWT_SECRET;
  return crypto.createHmac('sha256', secret).update(rawPhone).digest('hex');
};

/**
 * Find a user by phone. New accounts use the indexed lookup key; the bcrypt
 * fallback keeps older records created before phoneLookup was introduced
 * sign-in compatible until they are naturally migrated.
 */
userSchema.statics.findByPhone = async function (rawPhone) {
  const lookup = this.createPhoneLookup(rawPhone);
  const indexedUser = await this.findOne({ phoneLookup: lookup });
  if (indexedUser) return indexedUser;

  const users = await this.find({});
  for (const user of users) {
    if (await user.comparePhone(rawPhone)) {
      if (!user.phoneLookup) {
        user.phoneLookup = lookup;
        await user.save({ validateModifiedOnly: true });
      }
      return user;
    }
  }

  return null;
};

/**
 * Compare a raw phone number against the stored hash.
 */
userSchema.methods.comparePhone = async function (rawPhone) {
  return bcrypt.compare(rawPhone, this.phoneHash);
};

/**
 * Return a sanitised user object (strip sensitive fields).
 */
userSchema.methods.toSafeJSON = function () {
  const obj = this.toObject();
  delete obj.phoneHash;
  delete obj.phoneLookup;
  delete obj.__v;
  return obj;
};

module.exports = mongoose.model('User', userSchema);
