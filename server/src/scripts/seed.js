require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const CommunityPost = require('../models/CommunityPost');
const ConnectionRequest = require('../models/ConnectionRequest');
const DiaryEntry = require('../models/DiaryEntry');
const EncouragementNote = require('../models/EncouragementNote');
const MoodEntry = require('../models/MoodEntry');
const User = require('../models/User');
const { encrypt } = require('../utils/crypto');

const ids = {
  student: new mongoose.Types.ObjectId('66a000000000000000000001'),
  mentor: new mongoose.Types.ObjectId('66a000000000000000000002'),
  connection: new mongoose.Types.ObjectId('66a000000000000000000003'),
  moodToday: new mongoose.Types.ObjectId('66a000000000000000000004'),
  moodYesterday: new mongoose.Types.ObjectId('66a000000000000000000005'),
  diary: new mongoose.Types.ObjectId('66a000000000000000000006'),
  post: new mongoose.Types.ObjectId('66a000000000000000000007'),
  note: new mongoose.Types.ObjectId('66a000000000000000000008'),
};

async function seed() {
  if (!process.env.MONGODB_URI) {
    throw new Error('MONGODB_URI is required');
  }
  if (!process.env.JWT_SECRET || !process.env.ENCRYPTION_KEY) {
    throw new Error('JWT_SECRET and ENCRYPTION_KEY are required');
  }
  if (!/^[0-9a-fA-F]{64}$/.test(process.env.ENCRYPTION_KEY)) {
    throw new Error('ENCRYPTION_KEY must be a 32-byte hexadecimal value');
  }

  await connectDB();

  const [studentPhoneHash, mentorPhoneHash] = await Promise.all([
    User.hashPhone('0000000001'),
    User.hashPhone('0000000002'),
  ]);
  const sharedUserFields = {
    isVerified: true,
    gender: 'prefer-not-to-say',
    preferences: {
      fontSize: 'medium',
      notifications: true,
      autoSave: true,
    },
  };

  await User.findOneAndUpdate(
    { _id: ids.student },
    {
      $set: {
        ...sharedUserFields,
        phoneHash: studentPhoneHash,
        phoneLookup: User.createPhoneLookup('0000000001'),
        zkCommitment: 'mindmate-demo-student-v1',
        anonymousHandle: 'CuriousMaple24',
        userType: 'student',
        age: 20,
        course: 'Environmental Design',
        hobbies: ['sketching', 'walking', 'music'],
        connectedMentorId: ids.mentor,
        nickname: 'Curious Maple',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await User.findOneAndUpdate(
    { _id: ids.mentor },
    {
      $set: {
        ...sharedUserFields,
        phoneHash: mentorPhoneHash,
        phoneLookup: User.createPhoneLookup('0000000002'),
        zkCommitment: 'mindmate-demo-mentor-v1',
        anonymousHandle: 'KindWillow57',
        userType: 'elder',
        passion: 'Gardening and life-long learning',
        hobbies: ['gardening', 'reading', 'cooking'],
        nickname: 'Kind Willow',
      },
    },
    { upsert: true, new: true, setDefaultsOnInsert: true }
  );

  await Promise.all([
    ConnectionRequest.findOneAndUpdate(
      { _id: ids.connection },
      {
        $set: {
          studentId: ids.student,
          mentorId: ids.mentor,
          status: 'accepted',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    MoodEntry.findOneAndUpdate(
      { _id: ids.moodYesterday },
      {
        $set: {
          userId: ids.student,
          moodValue: 3,
          note: 'A steady day with time to reset.',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    MoodEntry.findOneAndUpdate(
      { _id: ids.moodToday },
      {
        $set: {
          userId: ids.student,
          moodValue: 4,
          note: 'Feeling hopeful after a good conversation.',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    DiaryEntry.findOneAndUpdate(
      { _id: ids.diary },
      {
        $set: {
          userId: ids.student,
          content: encrypt(
            'Demo journal entry: I made time for a short walk and felt more settled afterward.'
          ),
          mood: 'grateful',
          isEncrypted: true,
          sharedWithMentor: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    CommunityPost.findOneAndUpdate(
      { _id: ids.post },
      {
        $set: {
          authorId: ids.student,
          title: 'Small routines that help during a busy week',
          content:
            'Taking a short break between tasks has helped me feel more present. What small routines work for you?',
          category: 'Academic Stress',
          heartedBy: [ids.mentor],
          heartCount: 1,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
    EncouragementNote.findOneAndUpdate(
      { _id: ids.note },
      {
        $set: {
          authorId: ids.mentor,
          message:
            'You do not have to solve everything today. One kind step at a time is still progress.',
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ),
  ]);

  console.info(
    'Seed complete: 2 demo users, 1 accepted connection, 2 mood entries, 1 encrypted diary entry, 1 community post, and 1 encouragement note.'
  );
}

seed()
  .catch((error) => {
    console.error(`Seed failed: ${error.message}`);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
