const express = require('express');
const { protect } = require('../middleware/auth');
const {
  getPosts,
  createPost,
  toggleHeart,
  getEncouragement,
  addEncouragement,
} = require('../controllers/communityController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Community posts
router.get('/posts', getPosts);
router.post('/posts', createPost);
router.post('/posts/:id/heart', toggleHeart);

// Encouragement wall
router.get('/encouragement', getEncouragement);
router.post('/encouragement', addEncouragement);

module.exports = router;
