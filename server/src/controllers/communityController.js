const CommunityPost = require('../models/CommunityPost');
const EncouragementNote = require('../models/EncouragementNote');
const logger = require('../utils/logger');

// ─── Crisis keyword detection ───────────────────────────
const CRISIS_KEYWORDS = [
  'suicide',
  'kill myself',
  'end my life',
  'want to die',
  'self-harm',
  'self harm',
  'hurt myself',
  'cutting',
  'overdose',
  'no reason to live',
];

function containsCrisisContent(text) {
  const lower = text.toLowerCase();
  return CRISIS_KEYWORDS.some((keyword) => lower.includes(keyword));
}

/**
 * @desc    Get community posts
 * @route   GET /api/community/posts
 */
const getPosts = async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const posts = await CommunityPost.find()
      .populate('authorId', 'anonymousHandle')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await CommunityPost.countDocuments();

    // Annotate whether the current user has hearted each post
    const annotated = posts.map((post) => {
      const obj = post.toObject();
      obj.isHearted = obj.heartedBy.some(
        (id) => id.toString() === req.user._id.toString()
      );
      delete obj.heartedBy; // Don't expose full list
      return obj;
    });

    res.status(200).json({
      success: true,
      data: {
        posts: annotated,
        pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a community post
 * @route   POST /api/community/posts
 */
const createPost = async (req, res, next) => {
  try {
    const { title, content, category } = req.body;

    if (!title || !content) {
      return res.status(400).json({
        success: false,
        message: 'Title and content are required',
      });
    }

    // Crisis content check
    if (containsCrisisContent(title) || containsCrisisContent(content)) {
      logger.warn(
        `Crisis content detected in community post by ${req.user.anonymousHandle}`
      );
      // In production: alert moderators, send crisis resources to user
      // For now, still allow the post but flag it
    }

    const post = await CommunityPost.create({
      authorId: req.user._id,
      title,
      content,
      category: category || 'General',
    });

    await post.populate('authorId', 'anonymousHandle');

    res.status(201).json({
      success: true,
      data: { post },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Toggle heart on a community post
 * @route   POST /api/community/posts/:id/heart
 */
const toggleHeart = async (req, res, next) => {
  try {
    const post = await CommunityPost.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: 'Post not found',
      });
    }

    const userId = req.user._id;
    const alreadyHearted = post.heartedBy.some(
      (id) => id.toString() === userId.toString()
    );

    if (alreadyHearted) {
      post.heartedBy = post.heartedBy.filter(
        (id) => id.toString() !== userId.toString()
      );
      post.heartCount = Math.max(0, post.heartCount - 1);
    } else {
      post.heartedBy.push(userId);
      post.heartCount += 1;
    }

    await post.save();

    res.status(200).json({
      success: true,
      data: {
        heartCount: post.heartCount,
        isHearted: !alreadyHearted,
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get encouragement wall notes
 * @route   GET /api/community/encouragement
 */
const getEncouragement = async (req, res, next) => {
  try {
    const notes = await EncouragementNote.find()
      .sort({ createdAt: -1 })
      .limit(30);

    res.status(200).json({
      success: true,
      data: { notes },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Add an encouragement note
 * @route   POST /api/community/encouragement
 */
const addEncouragement = async (req, res, next) => {
  try {
    const { message } = req.body;

    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Message is required',
      });
    }

    if (message.length > 500) {
      return res.status(400).json({
        success: false,
        message: 'Message must be 500 characters or less',
      });
    }

    const note = await EncouragementNote.create({
      authorId: req.user._id,
      message: message.trim(),
    });

    res.status(201).json({
      success: true,
      data: { note },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getPosts,
  createPost,
  toggleHeart,
  getEncouragement,
  addEncouragement,
};
