const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getProfile,
  updateProfile,
  deleteAccount,
  listMentors,
} = require('../controllers/userController');

const router = express.Router();

// All routes require authentication
router.use(protect);

router.get('/me', getProfile);
router.put('/me', updateProfile);
router.delete('/me', deleteAccount);

// Only students can browse mentors
router.get('/mentors', authorize('student'), listMentors);

module.exports = router;
