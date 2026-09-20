const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const {
  sendRequest,
  getRequests,
  respondToRequest,
  getConnections,
  generateQR,
  scanQR,
} = require('../controllers/connectionController');

const router = express.Router();

// All routes require authentication
router.use(protect);

// Student sends connection request
router.post('/request', authorize('student'), sendRequest);

// Mentor gets and responds to requests
router.get('/requests', authorize('elder'), getRequests);
router.put('/requests/:id', authorize('elder'), respondToRequest);

// Both roles can view their connections
router.get('/mine', getConnections);

// QR-based connection
router.post('/qr/generate', generateQR);
router.post('/qr/scan', scanQR);

module.exports = router;
