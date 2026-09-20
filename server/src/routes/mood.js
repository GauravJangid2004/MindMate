const express = require('express');
const { protect } = require('../middleware/auth');
const {
  logMood,
  getMoodHistory,
  getMoodStats,
} = require('../controllers/moodController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/', logMood);
router.get('/', getMoodHistory);
router.get('/stats', getMoodStats);

module.exports = router;
