const geminiService = require('../services/geminiService');
const { matchMentorsWithWeightedScoring } = require('../services/mentorMatchingService');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * 1. Mentor Matching Support with Weighted Scoring
 * POST /api/ai/mentor-matching
 */
const mentorMatching = async (req, res, next) => {
  try {
    const { studentNeeds = '' } = req.body;
    if (typeof studentNeeds !== 'string' || studentNeeds.length > 1000) {
      return res.status(400).json({
        success: false,
        message: 'studentNeeds must be text no longer than 1000 characters.',
      });
    }

    const studentProfile = {
      course: req.user.course || '',
      hobbies: req.user.hobbies || [],
      userType: req.user.userType,
    };

    const mentors = await User.find({
      userType: 'elder',
      isVerified: true,
    })
      .select('anonymousHandle gender passion hobbies createdAt isVerified')
      .limit(50);

    const result = await matchMentorsWithWeightedScoring({
      studentNeeds:
        studentNeeds.trim() ||
        'I would like a supportive person to talk with about life and wellbeing.',
      studentProfile,
      mentors,
    });

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(`Error in mentorMatching: ${error.message}`);
    next(error);
  }
};

/**
 * 2. Profile Tagging
 * POST /api/ai/profile-tagging
 */
const profileTagging = async (req, res, next) => {
  try {
    const profileData = {
      userType: req.body.userType || req.user?.userType || 'student',
      course: req.body.course || req.user?.course,
      passion: req.body.passion || req.user?.passion,
      bio: req.body.bio,
      hobbies: req.body.hobbies || req.user?.hobbies || [],
    };

    const tagsResult = await geminiService.extractProfileTags(profileData);

    res.status(200).json({
      success: true,
      data: tagsResult,
    });
  } catch (error) {
    logger.error(`Error in profileTagging: ${error.message}`);
    next(error);
  }
};

/**
 * 3. Wisdom Wall Categorization
 * POST /api/ai/categorize-wisdom
 */
const categorizeWisdom = async (req, res, next) => {
  try {
    const { storyContent, title = '' } = req.body;
    if (!storyContent) {
      return res.status(400).json({
        success: false,
        message: 'Story content is required for categorization.',
      });
    }

    const categorization = await geminiService.categorizeWisdom(storyContent, title);

    res.status(200).json({
      success: true,
      data: categorization,
    });
  } catch (error) {
    logger.error(`Error in categorizeWisdom: ${error.message}`);
    next(error);
  }
};

/**
 * 4. Story Summarization
 * POST /api/ai/summarize-story
 */
const summarizeStory = async (req, res, next) => {
  try {
    const { storyContent } = req.body;
    if (!storyContent) {
      return res.status(400).json({
        success: false,
        message: 'Story content is required for summarization.',
      });
    }

    const summary = await geminiService.summarizeStory(storyContent);

    res.status(200).json({
      success: true,
      data: summary,
    });
  } catch (error) {
    logger.error(`Error in summarizeStory: ${error.message}`);
    next(error);
  }
};

/**
 * 5. Micro-Guidance Formatting
 * POST /api/ai/micro-guidance
 */
const microGuidance = async (req, res, next) => {
  try {
    const { adviceText } = req.body;
    if (!adviceText) {
      return res.status(400).json({
        success: false,
        message: 'Advice text is required to format micro-guidance.',
      });
    }

    const formatted = await geminiService.formatMicroGuidance(adviceText);

    res.status(200).json({
      success: true,
      data: formatted,
    });
  } catch (error) {
    logger.error(`Error in microGuidance: ${error.message}`);
    next(error);
  }
};

/**
 * 6. Multilingual Support
 * POST /api/ai/translate
 */
const translate = async (req, res, next) => {
  try {
    const { text, targetLanguage = 'Hindi' } = req.body;
    if (!text) {
      return res.status(400).json({
        success: false,
        message: 'Text is required for translation.',
      });
    }

    const result = await geminiService.translateText(text, targetLanguage);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error(`Error in translate: ${error.message}`);
    next(error);
  }
};

/**
 * 7. Conversation Starters
 * POST /api/ai/conversation-starters
 */
const conversationStarters = async (req, res, next) => {
  try {
    const { mentorId } = req.body;
    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: 'mentorId is required.',
      });
    }

    const mentor = await User.findOne({
      _id: mentorId,
      userType: 'elder',
      isVerified: true,
    }).select('anonymousHandle passion hobbies gender');
    if (!mentor) {
      return res.status(404).json({
        success: false,
        message: 'Verified mentor not found.',
      });
    }

    const studentProfile = {
      course: req.user.course,
      hobbies: req.user.hobbies,
    };

    const starters = await geminiService.generateConversationStarters(
      studentProfile,
      mentor
    );

    res.status(200).json({
      success: true,
      data: starters,
    });
  } catch (error) {
    logger.error(`Error in conversationStarters: ${error.message}`);
    next(error);
  }
};

/**
 * 8. Content Moderation Support
 * POST /api/ai/moderate
 */
const moderateContent = async (req, res, next) => {
  try {
    const { content } = req.body;
    if (!content) {
      return res.status(400).json({
        success: false,
        message: 'Content is required for moderation review.',
      });
    }

    const moderation = await geminiService.moderateContent(content);

    res.status(200).json({
      success: true,
      data: moderation,
    });
  } catch (error) {
    logger.error(`Error in moderateContent: ${error.message}`);
    next(error);
  }
};

/**
 * 9. Mentor Chat Assistant
 * POST /api/ai/mentor-chat
 */
const mentorChat = async (req, res, next) => {
  try {
    const { message, history } = req.body;
    if (!message || typeof message !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Message is required for mentor chatbot assistant.',
      });
    }

    // Fetch verified mentors for contextual recommendations
    const mentors = await User.find({
      userType: 'elder',
      isVerified: true,
    })
      .select('anonymousHandle gender passion hobbies')
      .limit(10)
      .lean();

    const response = await geminiService.chatMentorAssistant({
      message: message.trim(),
      history: Array.isArray(history) ? history : [],
      mentors,
      userRole: req.user?.userType || 'student',
    });

    res.status(200).json({
      success: true,
      data: response,
    });
  } catch (error) {
    logger.error(`Error in mentorChat: ${error.message}`);
    next(error);
  }
};

module.exports = {
  mentorMatching,
  profileTagging,
  categorizeWisdom,
  summarizeStory,
  microGuidance,
  translate,
  conversationStarters,
  moderateContent,
  mentorChat,
};
