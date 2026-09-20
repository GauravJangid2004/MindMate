const ConnectionRequest = require('../models/ConnectionRequest');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const { generateToken: generateCryptoToken } = require('../utils/crypto');
const logger = require('../utils/logger');

// In-memory QR token store (in production, use Redis with TTL)
const qrTokenStore = new Map();

/**
 * @desc    Student sends connection request to a mentor
 * @route   POST /api/connections/request
 */
const sendRequest = async (req, res, next) => {
  try {
    const { mentorId } = req.body;

    if (!mentorId) {
      return res.status(400).json({
        success: false,
        message: 'mentorId is required',
      });
    }

    // Verify mentor exists and is an elder
    const mentor = await User.findById(mentorId);
    if (!mentor || mentor.userType !== 'elder') {
      return res.status(404).json({
        success: false,
        message: 'Mentor not found',
      });
    }

    // Check for existing pending request
    const existingRequest = await ConnectionRequest.findOne({
      studentId: req.user._id,
      mentorId,
      status: 'pending',
    });

    if (existingRequest) {
      return res.status(409).json({
        success: false,
        message: 'You already have a pending request to this mentor',
      });
    }

    const request = await ConnectionRequest.create({
      studentId: req.user._id,
      mentorId,
    });

    logger.info(
      `Connection request sent from ${req.user.anonymousHandle} to mentor ${mentor.anonymousHandle}`
    );

    res.status(201).json({
      success: true,
      message: 'Connection request sent',
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mentor gets pending connection requests
 * @route   GET /api/connections/requests
 */
const getRequests = async (req, res, next) => {
  try {
    const requests = await ConnectionRequest.find({
      mentorId: req.user._id,
      status: 'pending',
    })
      .populate('studentId', 'anonymousHandle age gender course hobbies')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: { requests },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Mentor accepts or rejects a connection request
 * @route   PUT /api/connections/requests/:id
 */
const respondToRequest = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { action } = req.body; // 'accept' or 'reject'

    if (!['accept', 'reject'].includes(action)) {
      return res.status(400).json({
        success: false,
        message: 'Action must be either "accept" or "reject"',
      });
    }

    const request = await ConnectionRequest.findById(id);

    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Connection request not found',
      });
    }

    // Ensure the mentor owns this request
    if (request.mentorId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'You are not authorized to respond to this request',
      });
    }

    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'This request has already been responded to',
      });
    }

    if (action === 'accept') {
      request.status = 'accepted';
      await request.save();

      // Link the student to this mentor
      await User.findByIdAndUpdate(request.studentId, {
        connectedMentorId: req.user._id,
      });

      // Create a conversation between them
      const existingConversation = await Conversation.findOne({
        participants: { $all: [request.studentId, req.user._id] },
      });

      if (!existingConversation) {
        await Conversation.create({
          participants: [request.studentId, req.user._id],
        });
      }

      logger.info(
        `Connection accepted between student ${request.studentId} and mentor ${req.user.anonymousHandle}`
      );
    } else {
      request.status = 'rejected';
      await request.save();
    }

    res.status(200).json({
      success: true,
      message: `Request ${action}ed successfully`,
      data: { request },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get connected students (for mentors) or mentors (for students)
 * @route   GET /api/connections/mine
 */
const getConnections = async (req, res, next) => {
  try {
    if (req.user.userType === 'elder') {
      // Get all students connected to this mentor
      const students = await User.find({
        connectedMentorId: req.user._id,
        userType: 'student',
      }).select('anonymousHandle age gender course hobbies createdAt');

      res.status(200).json({
        success: true,
        data: { connections: students },
      });
    } else {
      // Get the student's mentor
      const mentor = req.user.connectedMentorId
        ? await User.findById(req.user.connectedMentorId).select(
            'anonymousHandle gender passion hobbies createdAt'
          )
        : null;

      res.status(200).json({
        success: true,
        data: { connections: mentor ? [mentor] : [] },
      });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate a QR connection token
 * @route   POST /api/connections/qr/generate
 */
const generateQR = async (req, res, next) => {
  try {
    const token = generateCryptoToken(16);

    // Store token with 10 minute expiry
    qrTokenStore.set(token, {
      userId: req.user._id,
      userType: req.user.userType,
      expiresAt: Date.now() + 10 * 60 * 1000,
    });

    res.status(200).json({
      success: true,
      data: { qrToken: token },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Scan a QR token to complete connection
 * @route   POST /api/connections/qr/scan
 */
const scanQR = async (req, res, next) => {
  try {
    const { qrToken } = req.body;

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        message: 'QR token is required',
      });
    }

    const stored = qrTokenStore.get(qrToken);

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired QR token',
      });
    }

    if (Date.now() > stored.expiresAt) {
      qrTokenStore.delete(qrToken);
      return res.status(400).json({
        success: false,
        message: 'QR token has expired',
      });
    }

    // Determine who is the student and who is the mentor
    const scannerId = req.user._id;
    const ownerId = stored.userId;

    let studentId, mentorId;

    if (req.user.userType === 'student' && stored.userType === 'elder') {
      studentId = scannerId;
      mentorId = ownerId;
    } else if (req.user.userType === 'elder' && stored.userType === 'student') {
      studentId = ownerId;
      mentorId = scannerId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'QR connection requires one student and one mentor',
      });
    }

    // Link student to mentor
    await User.findByIdAndUpdate(studentId, { connectedMentorId: mentorId });

    // Create conversation
    const existingConversation = await Conversation.findOne({
      participants: { $all: [studentId, mentorId] },
    });

    if (!existingConversation) {
      await Conversation.create({
        participants: [studentId, mentorId],
      });
    }

    // Clean up QR token
    qrTokenStore.delete(qrToken);

    logger.info(`QR connection completed between student ${studentId} and mentor ${mentorId}`);

    res.status(200).json({
      success: true,
      message: 'Connection established successfully',
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  sendRequest,
  getRequests,
  respondToRequest,
  getConnections,
  generateQR,
  scanQR,
};
