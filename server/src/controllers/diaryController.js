const DiaryEntry = require('../models/DiaryEntry');
const User = require('../models/User');
const { encrypt, decrypt } = require('../utils/crypto');
const logger = require('../utils/logger');

/**
 * @desc    Get current user's diary entries
 * @route   GET /api/diary
 */
const getEntries = async (req, res, next) => {
  try {
    const entries = await DiaryEntry.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .limit(50);

    // Decrypt content
    const decryptedEntries = entries.map((entry) => {
      const obj = entry.toObject();
      if (obj.isEncrypted && obj.content) {
        try {
          obj.content = decrypt(obj.content);
        } catch {
          obj.content = '[could not decrypt]';
        }
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      data: { entries: decryptedEntries },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new diary entry
 * @route   POST /api/diary
 */
const createEntry = async (req, res, next) => {
  try {
    const { content, mood } = req.body;

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Diary content is required',
      });
    }

    // Encrypt content at rest
    const encryptedContent = encrypt(content);

    const entry = await DiaryEntry.create({
      userId: req.user._id,
      content: encryptedContent,
      mood: mood || 'neutral',
      isEncrypted: true,
    });

    // Return with decrypted content for immediate display
    const responseEntry = entry.toObject();
    responseEntry.content = content;

    logger.info(`Diary entry created by ${req.user.anonymousHandle}`);

    res.status(201).json({
      success: true,
      data: { entry: responseEntry },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete a diary entry
 * @route   DELETE /api/diary/:id
 */
const deleteEntry = async (req, res, next) => {
  try {
    const entry = await DiaryEntry.findById(req.params.id);

    if (!entry) {
      return res.status(404).json({
        success: false,
        message: 'Diary entry not found',
      });
    }

    // Ensure user owns this entry
    if (entry.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You can only delete your own diary entries',
      });
    }

    await entry.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Diary entry deleted',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mentor reads connected student's diary
 * @route   GET /api/diary/student/:studentId
 */
const getStudentDiary = async (req, res, next) => {
  try {
    const { studentId } = req.params;

    // Verify the student is connected to this mentor
    const student = await User.findById(studentId);
    if (!student || student.userType !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student not found',
      });
    }

    if (
      !student.connectedMentorId ||
      student.connectedMentorId.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({
        success: false,
        message: 'You can only read diary entries of students connected to you',
      });
    }

    const entries = await DiaryEntry.find({ userId: studentId })
      .sort({ createdAt: -1 })
      .limit(50);

    // Decrypt content
    const decryptedEntries = entries.map((entry) => {
      const obj = entry.toObject();
      if (obj.isEncrypted && obj.content) {
        try {
          obj.content = decrypt(obj.content);
        } catch {
          obj.content = '[could not decrypt]';
        }
      }
      return obj;
    });

    res.status(200).json({
      success: true,
      data: {
        student: {
          id: student._id,
          anonymousHandle: student.anonymousHandle,
        },
        entries: decryptedEntries,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { getEntries, createEntry, deleteEntry, getStudentDiary };
