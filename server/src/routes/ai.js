const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const {
  mentorMatching,
  profileTagging,
  categorizeWisdom,
  summarizeStory,
  microGuidance,
  translate,
  conversationStarters,
  moderateContent,
  mentorChat,
} = require('../controllers/aiController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * Flexible auth middleware: Attaches user if valid JWT is present,
 * but does not reject unauthenticated calls for general preview features.
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    if (token && process.env.JWT_SECRET) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-phoneHash -__v');
      if (user) req.user = user;
    }
  } catch (err) {
    // Ignore invalid token and proceed as guest
  }
  next();
};

router.use(optionalAuth);

// Mentor matching uses private student needs and is available to signed-in students.
router.post('/mentor-matching', protect, authorize('student'), mentorMatching);

// 2. Profile Tagging (Extract topics, interests, skills, experience)
router.post('/profile-tagging', profileTagging);

// 3. Wisdom Wall Categorization (Categorize stories & life lessons)
router.post('/categorize-wisdom', categorizeWisdom);

// 4. Story Summarization (Short summaries of shared experiences)
router.post('/summarize-story', summarizeStory);

// 5. Micro-Guidance Formatting (Organize mentor advice into actionable points)
router.post('/micro-guidance', microGuidance);

// 6. Multilingual Support (Translate messages & content)
router.post('/translate', translate);

// 7. Conversation Starters (Suggest questions for icebreakers)
router.post('/conversation-starters', protect, authorize('student'), conversationStarters);

// 8. Content Moderation Support (Flag potentially harmful/inappropriate content)
router.post('/moderate', moderateContent);

// 9. Mentor Assistant Mini-Chatbot
router.post('/mentor-chat', mentorChat);

module.exports = router;
