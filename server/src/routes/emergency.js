const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getContacts,
  createContact,
  deleteContact,
} = require('../controllers/emergencyController');

const router = express.Router();

router.use(protect);

router.get('/', getContacts);
router.post(
  '/',
  [
    body('name').trim().isLength({ min: 1, max: 100 }),
    body('relationship').optional().trim().isLength({ max: 50 }),
    body('phone').trim().isLength({ min: 3, max: 30 }),
  ],
  validate,
  createContact
);
router.delete('/:id', deleteContact);

module.exports = router;
