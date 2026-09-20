const User = require('../models/User');
const DiaryEntry = require('../models/DiaryEntry');
const MoodEntry = require('../models/MoodEntry');
const Message = require('../models/Message');
const Conversation = require('../models/Conversation');
const ConnectionRequest = require('../models/ConnectionRequest');
const CommunityPost = require('../models/CommunityPost');
const EncouragementNote = require('../models/EncouragementNote');
const logger = require('../utils/logger');

/**
 * @desc    Get current user profile
 * @route   GET /api/users/me
 */
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-phoneHash -__v')
      .populate('connectedMentorId', 'anonymousHandle gender passion hobbies');

    res.status(200).json({
      success: true,
      data: { user: user.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update current user profile
 * @route   PUT /api/users/me
 */
const updateProfile = async (req, res, next) => {
  try {
    // Fields that can be updated
    const allowedFields = [
      'nickname',
      'gender',
      'course',
      'hobbies',
      'passion',
      'age',
    ];
    const preferenceFields = ['fontSize', 'notifications', 'autoSave'];

    const updates = {};

    // Pick allowed fields
    for (const field of allowedFields) {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    }

    // Handle nested preferences
    if (req.body.preferences) {
      for (const field of preferenceFields) {
        if (req.body.preferences[field] !== undefined) {
          updates[`preferences.${field}`] = req.body.preferences[field];
        }
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-phoneHash -__v');

    res.status(200).json({
      success: true,
      data: { user: user.toSafeJSON() },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete user account and all associated data
 * @route   DELETE /api/users/me
 */
const deleteAccount = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Delete all user data in parallel
    await Promise.all([
      DiaryEntry.deleteMany({ userId }),
      MoodEntry.deleteMany({ userId }),
      Message.deleteMany({ senderId: userId }),
      CommunityPost.deleteMany({ authorId: userId }),
      EncouragementNote.deleteMany({ authorId: userId }),
      ConnectionRequest.deleteMany({
        $or: [{ studentId: userId }, { mentorId: userId }],
      }),
    ]);

    // Remove user from conversations
    await Conversation.deleteMany({ participants: userId });

    // If user is a student, clear mentor reference
    // If user is a mentor, clear student references to this mentor
    if (req.user.userType === 'elder') {
      await User.updateMany(
        { connectedMentorId: userId },
        { $set: { connectedMentorId: null } }
      );
    }

    // Delete the user
    await User.findByIdAndDelete(userId);

    logger.info(`Account deleted: ${req.user.anonymousHandle}`);

    res.status(200).json({
      success: true,
      message: 'Account and all associated data deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    List available mentors (for student matching)
 * @route   GET /api/users/mentors
 */
const listMentors = async (req, res, next) => {
  try {
    const mentors = await User.find({
      userType: 'elder',
      isVerified: true,
    })
      .select('anonymousHandle gender passion hobbies createdAt')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { mentors },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getProfile, updateProfile, deleteAccount, listMentors };
