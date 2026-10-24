const ConnectionRequest = require('../models/ConnectionRequest');
const Conversation = require('../models/Conversation');
const User = require('../models/User');
const QRConnectionToken = require('../models/QRConnectionToken');
const { generateToken: generateCryptoToken } = require('../utils/crypto');
const logger = require('../utils/logger');
const crypto = require('crypto');

const hashQRToken = (token) =>
  crypto.createHash('sha256').update(token).digest('hex');

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

    if (req.user.connectedMentorId) {
      return res.status(409).json({
        success: false,
        message: 'You are already connected to a mentor',
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
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Replace any currently active code generated by this user.
    await QRConnectionToken.deleteMany({
      ownerId: req.user._id,
      expiresAt: { $gt: new Date() },
    });

    await QRConnectionToken.create({
      tokenHash: hashQRToken(token),
      ownerId: req.user._id,
      ownerType: req.user.userType,
      expiresAt,
    });

    res.status(200).json({
      success: true,
      data: {
        qrToken: token,
        qrPayload: `mindmate://connect?token=${encodeURIComponent(token)}`,
        expiresAt,
      },
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
    const { qrToken: rawQrToken } = req.body;
    const qrToken = typeof rawQrToken === 'string' ? rawQrToken.trim() : '';

    if (!qrToken) {
      return res.status(400).json({
        success: false,
        message: 'QR token is required',
      });
    }

    let parsedToken = qrToken;
    try {
      const parsed = new URL(qrToken);
      if (parsed.protocol === 'mindmate:' && parsed.hostname === 'connect') {
        parsedToken = parsed.searchParams.get('token') || '';
      }
    } catch {
      // Raw token values are also accepted for copy/paste compatibility.
    }

    const stored = await QRConnectionToken.findOne({
      tokenHash: hashQRToken(parsedToken),
    });

    if (!stored) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired QR token',
      });
    }

    if (Date.now() > stored.expiresAt.getTime()) {
      await QRConnectionToken.deleteOne({ _id: stored._id });
      return res.status(400).json({
        success: false,
        message: 'QR token has expired',
      });
    }

    // Determine who is the student and who is the mentor
    const scannerId = req.user._id;
    const ownerId = stored.ownerId;

    if (scannerId.toString() === ownerId.toString()) {
      return res.status(400).json({
        success: false,
        message: 'You cannot connect to your own QR code',
      });
    }

    let studentId, mentorId;

    if (req.user.userType === 'student' && stored.ownerType === 'elder') {
      studentId = scannerId;
      mentorId = ownerId;
    } else if (req.user.userType === 'elder' && stored.ownerType === 'student') {
      studentId = ownerId;
      mentorId = scannerId;
    } else {
      return res.status(400).json({
        success: false,
        message: 'QR connection requires one student and one mentor',
      });
    }

    const student = await User.findById(studentId).select('connectedMentorId userType');
    if (!student || student.userType !== 'student') {
      return res.status(404).json({
        success: false,
        message: 'Student account not found',
      });
    }

    if (
      student.connectedMentorId &&
      student.connectedMentorId.toString() !== mentorId.toString()
    ) {
      return res.status(409).json({
        success: false,
        message: 'This student is already connected to another mentor',
      });
    }

    const mentor = await User.findById(mentorId).select('userType');
    if (!mentor || mentor.userType !== 'elder') {
      return res.status(404).json({
        success: false,
        message: 'Mentor account not found',
      });
    }

    // Atomically consume the token after all validation. This prevents two
    // scanners from successfully redeeming the same QR code concurrently.
    const consumedToken = await QRConnectionToken.findOneAndDelete({
      _id: stored._id,
    });
    if (!consumedToken) {
      return res.status(409).json({
        success: false,
        message: 'This QR code has already been used',
      });
    }

    // Link student to mentor.
    await User.findByIdAndUpdate(studentId, { connectedMentorId: mentorId });

    // Keep QR connections visible in the same request history as normal
    // mentor requests.
    await ConnectionRequest.findOneAndUpdate(
      { studentId, mentorId },
      { $set: { status: 'accepted' }, $setOnInsert: { studentId, mentorId } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Create conversation
    const existingConversation = await Conversation.findOne({
      participants: { $all: [studentId, mentorId], $size: 2 },
    });

    const conversation = existingConversation || await Conversation.create({
        participants: [studentId, mentorId],
      });

    logger.info(`QR connection completed between student ${studentId} and mentor ${mentorId}`);

    res.status(200).json({
      success: true,
      message: 'Connection established successfully',
      data: { conversationId: conversation._id },
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
