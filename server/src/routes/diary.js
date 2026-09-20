const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  getEntries,
  createEntry,
  deleteEntry,
  getStudentDiary,
} = require('../controllers/diaryController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student diary CRUD
router.get('/', getEntries);
router.post('/', createEntry);
router.delete('/:id', deleteEntry);

// Mentor reads connected student's diary
router.get('/student/:studentId', authorize('elder'), getStudentDiary);

module.exports = router;
