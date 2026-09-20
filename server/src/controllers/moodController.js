const MoodEntry = require('../models/MoodEntry');
const logger = require('../utils/logger');

/**
 * @desc    Log a mood entry
 * @route   POST /api/mood
 */
const logMood = async (req, res, next) => {
  try {
    const { moodValue, note } = req.body;

    if (!moodValue || moodValue < 1 || moodValue > 5) {
      return res.status(400).json({
        success: false,
        message: 'moodValue is required and must be between 1 and 5',
      });
    }

    const entry = await MoodEntry.create({
      userId: req.user._id,
      moodValue: Math.round(moodValue),
      note: note || '',
    });

    res.status(201).json({
      success: true,
      data: { entry },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get mood history
 * @route   GET /api/mood?days=7
 */
const getMoodHistory = async (req, res, next) => {
  try {
    const days = parseInt(req.query.days) || 7;
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const entries = await MoodEntry.find({
      userId: req.user._id,
      createdAt: { $gte: startDate },
    }).sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { entries },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get mood statistics (average, streak, count)
 * @route   GET /api/mood/stats
 */
const getMoodStats = async (req, res, next) => {
  try {
    const userId = req.user._id;

    // Total entries
    const totalEntries = await MoodEntry.countDocuments({ userId });

    // Entries this week
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEntries = await MoodEntry.countDocuments({
      userId,
      createdAt: { $gte: weekStart },
    });

    // Average mood (all time)
    const avgResult = await MoodEntry.aggregate([
      { $match: { userId } },
      { $group: { _id: null, avgMood: { $avg: '$moodValue' } } },
    ]);
    const averageMood = avgResult.length > 0 ? avgResult[0].avgMood : 0;

    // Streak calculation: count consecutive days with at least one entry
    const entries = await MoodEntry.find({ userId })
      .sort({ createdAt: -1 })
      .select('createdAt');

    let streak = 0;
    if (entries.length > 0) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const entryDates = new Set(
        entries.map((e) => {
          const d = new Date(e.createdAt);
          d.setHours(0, 0, 0, 0);
          return d.getTime();
        })
      );

      // Check from today backwards
      let checkDate = new Date(today);
      // Allow for today or yesterday to start the streak
      if (!entryDates.has(checkDate.getTime())) {
        checkDate.setDate(checkDate.getDate() - 1);
      }

      while (entryDates.has(checkDate.getTime())) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      }
    }

    res.status(200).json({
      success: true,
      data: {
        stats: {
          totalEntries,
          weekEntries,
          averageMood: Math.round(averageMood * 10) / 10,
          streak,
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = { logMood, getMoodHistory, getMoodStats };
