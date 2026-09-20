const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getConversations,
  getMessages,
  sendMessage,
} = require('../controllers/chatController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/conversations', getConversations);
router.get('/:conversationId/messages', getMessages);
router.post('/:conversationId/messages', sendMessage);

module.exports = router;
