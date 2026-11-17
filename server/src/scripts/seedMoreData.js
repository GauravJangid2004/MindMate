require('dotenv').config();

const mongoose = require('mongoose');
const connectDB = require('../config/db');
const User = require('../models/User');
const CommunityPost = require('../models/CommunityPost');
const DiaryEntry = require('../models/DiaryEntry');
const EncouragementNote = require('../models/EncouragementNote');
const { encrypt } = require('../utils/crypto');

const mentorsData = [
  {
    phone: '9876543101',
    anonymousHandle: 'MM-WILLOW-7A12',
    nickname: 'Dr. Aris (Kind Willow)',
    userType: 'elder',
    isVerified: true,
    gender: 'male',
    passion: 'Retired Professor of Psychology with 30 years experience helping students handle academic burnout, exam stress, and discovering self-compassion.',
    hobbies: ['gardening', 'reading', 'meditation', 'tea brewing'],
  },
  {
    phone: '9876543102',
    anonymousHandle: 'MM-CEDAR-9B34',
    nickname: 'Elena (Calm Cedar)',
    userType: 'elder',
    isVerified: true,
    gender: 'female',
    passion: 'Former Software Engineering Director & tech mentor. Passionate about guiding young engineers through imposter syndrome, career crossroads, and work-life balance.',
    hobbies: ['coding', 'chess', 'hiking', 'sci-fi books'],
  },
  {
    phone: '9876543103',
    anonymousHandle: 'MM-BREEZE-4C56',
    nickname: 'Marcus (Gentle Breeze)',
    userType: 'elder',
    isVerified: true,
    gender: 'male',
    passion: 'Retired Creative Arts & Literature Educator. Dedicated to helping students express emotions, process grief, and find peace through journaling and art.',
    hobbies: ['painting', 'writing', 'classical music', 'sketching'],
  },
  {
    phone: '9876543104',
    anonymousHandle: 'MM-PEBBLE-2D78',
    nickname: 'Sarah (Quiet Pebble)',
    userType: 'elder',
    isVerified: true,
    gender: 'female',
    passion: 'Former University Career & Student Life Counselor. Loving guide for overcoming interview anxiety, self-doubt, and major life transitions.',
    hobbies: ['pottery', 'baking', 'walking', 'podcasts'],
  },
  {
    phone: '9876543105',
    anonymousHandle: 'MM-SUNLIGHT-8E90',
    nickname: 'David (Warm Sunlight)',
    userType: 'elder',
    isVerified: true,
    gender: 'male',
    passion: 'Retired Physician & wellness advocate. Passionate about helping students build healthy sleep habits, manage panic attacks, and cultivate mindfulness.',
    hobbies: ['tai chi', 'cooking', 'cycling', 'gardening'],
  },
  {
    phone: '9876543106',
    anonymousHandle: 'MM-OCEAN-3F12',
    nickname: 'Maya (Ocean Breeze)',
    userType: 'elder',
    isVerified: true,
    gender: 'female',
    passion: 'Former High School Principal and empathetic listener. Passionate about family communication, resolving roommate conflict, and building emotional resilience.',
    hobbies: ['yoga', 'knitting', 'bird watching', 'storytelling'],
  },
  {
    phone: '9876543107',
    anonymousHandle: 'MM-MOUNTAIN-5G34',
    nickname: 'Thomas (Mountain Echo)',
    userType: 'elder',
    isVerified: true,
    gender: 'male',
    passion: 'Retired Environmental Scientist & wilderness educator. Passionate about grounding exercises, digital detox, and reconnecting with nature.',
    hobbies: ['woodworking', 'astronomy', 'camping', 'photography'],
  },
  {
    phone: '9876543108',
    anonymousHandle: 'MM-DAWN-6H56',
    nickname: 'Anita (Golden Dawn)',
    userType: 'elder',
    isVerified: true,
    gender: 'female',
    passion: 'Former Social Worker and community volunteer. Offering a warm, non-judgmental space for students struggling with loneliness, identity, and homesickness.',
    hobbies: ['classical singing', 'gardening', 'reading', 'swimming'],
  },
];

const studentsData = [
  {
    phone: '9876543201',
    anonymousHandle: 'MM-MAPLE-1A23',
    nickname: 'Aria (Curious Maple)',
    userType: 'student',
    isVerified: true,
    age: 20,
    gender: 'female',
    course: 'Environmental Design & Architecture',
    hobbies: ['sketching', 'walking', 'music', 'plants'],
  },
  {
    phone: '9876543202',
    anonymousHandle: 'MM-STARS-4B56',
    nickname: 'Rohan (Starlit Sky)',
    userType: 'student',
    isVerified: true,
    age: 21,
    gender: 'male',
    course: 'Computer Science & AI',
    hobbies: ['coding', 'gaming', 'chess', 'podcasts'],
  },
  {
    phone: '9876543203',
    anonymousHandle: 'MM-MEADOW-7C89',
    nickname: 'Priya (Sunny Meadow)',
    userType: 'student',
    isVerified: true,
    age: 19,
    gender: 'female',
    course: 'Biomedical Sciences',
    hobbies: ['reading', 'running', 'baking', 'yoga'],
  },
  {
    phone: '9876543204',
    anonymousHandle: 'MM-RIVER-9D01',
    nickname: 'Kiran (Quiet River)',
    userType: 'student',
    isVerified: true,
    age: 22,
    gender: 'other',
    course: 'Business Administration',
    hobbies: ['photography', 'travelling', 'music', 'coffee'],
  },
];

async function seedData() {
  await connectDB();
  console.log('Connected to MongoDB for data seeding...');

  // 1. Seed Mentors
  const createdMentors = [];
  for (const m of mentorsData) {
    const phoneHash = await User.hashPhone(m.phone);
    const phoneLookup = User.createPhoneLookup(m.phone);
    const zkCommitment = `zk-mentor-${m.anonymousHandle.toLowerCase()}`;

    const mentor = await User.findOneAndUpdate(
      { anonymousHandle: m.anonymousHandle },
      {
        $set: {
          phoneHash,
          phoneLookup,
          zkCommitment,
          anonymousHandle: m.anonymousHandle,
          nickname: m.nickname,
          userType: 'elder',
          isVerified: true,
          gender: m.gender,
          passion: m.passion,
          hobbies: m.hobbies,
          preferences: { fontSize: 'medium', notifications: true, autoSave: true },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    createdMentors.push(mentor);
  }
  console.log(`Seeded/Updated ${createdMentors.length} mentors.`);

  // 2. Seed Students
  const createdStudents = [];
  for (const s of studentsData) {
    const phoneHash = await User.hashPhone(s.phone);
    const phoneLookup = User.createPhoneLookup(s.phone);
    const zkCommitment = `zk-student-${s.anonymousHandle.toLowerCase()}`;

    const student = await User.findOneAndUpdate(
      { anonymousHandle: s.anonymousHandle },
      {
        $set: {
          phoneHash,
          phoneLookup,
          zkCommitment,
          anonymousHandle: s.anonymousHandle,
          nickname: s.nickname,
          userType: 'student',
          isVerified: true,
          age: s.age,
          gender: s.gender,
          course: s.course,
          hobbies: s.hobbies,
          preferences: { fontSize: 'medium', notifications: true, autoSave: true },
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    createdStudents.push(student);
  }
  console.log(`Seeded/Updated ${createdStudents.length} students.`);

  // Pick some students and mentors for posts and diary
  const primaryStudent = createdStudents[0];
  const secondaryStudent = createdStudents[1];
  const primaryMentor = createdMentors[0];
  const techMentor = createdMentors[1];

  // 3. Seed Community Posts
  const communityPosts = [
    {
      authorId: primaryStudent._id,
      title: 'Small routines that help during midterms week',
      content: 'Taking a 10-minute walk between study blocks and drinking a warm mug of herbal tea has drastically reduced my headaches. What small routines keep you grounded when exams get intense?',
      category: 'Academic Stress',
      heartedBy: [primaryMentor._id, secondaryStudent._id],
      heartCount: 2,
    },
    {
      authorId: secondaryStudent._id,
      title: 'Overcoming Imposter Syndrome in Tech & Coding classes',
      content: 'I spent weeks feeling like everyone else understands algorithms faster than me. Speaking with my elder mentor helped me see that confusion is a normal stage of learning, not a personal flaw. If you feel like an imposter today, you are not alone.',
      category: 'Career',
      heartedBy: [techMentor._id, primaryStudent._id],
      heartCount: 5,
    },
    {
      authorId: primaryMentor._id,
      title: 'A gentle reminder: You don’t have to have it all figured out at 20',
      content: 'Over four decades in education, the happiest people I have known did not follow a straight, rigid path. Life has twists, pauses, and course corrections. Be patient with your current chapter.',
      category: 'General',
      heartedBy: [primaryStudent._id, secondaryStudent._id],
      heartCount: 9,
    },
    {
      authorId: createdStudents[2]._id,
      title: 'First semester away from home — dealing with quiet evenings',
      content: 'The hardest part of college has been coming back to a quiet dorm room after class. I started calling my grandparents on Sundays and cooking home recipes. It really helps the homesickness.',
      category: 'Loneliness',
      heartedBy: [createdMentors[5]._id],
      heartCount: 3,
    },
    {
      authorId: createdMentors[4]._id,
      title: 'The 4-7-8 Breathing technique for panic & acute stress',
      content: 'Inhale through your nose for 4 seconds, hold gently for 7 seconds, and exhale slowly through your mouth for 8 seconds. Repeating this 4 times stimulates your parasympathetic nervous system and lowers your heart rate. Try it before your next exam or presentation!',
      category: 'Mental Health',
      heartedBy: [primaryStudent._id, secondaryStudent._id, createdStudents[2]._id],
      heartCount: 12,
    },
    {
      authorId: createdStudents[3]._id,
      title: 'Learning to say no without feeling guilty',
      content: 'I used to say yes to every group project role, social event, and favor until I burned out completely last month. Setting boundaries feels uncomfortable at first, but protecting your mental energy is essential.',
      category: 'Relationships',
      heartedBy: [createdMentors[3]._id],
      heartCount: 6,
    },
  ];

  for (const post of communityPosts) {
    await CommunityPost.findOneAndUpdate(
      { title: post.title },
      { $set: post },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Seeded ${communityPosts.length} community wall posts.`);

  // 4. Seed Encrypted Diary Entries
  const diaryEntries = [
    {
      userId: primaryStudent._id,
      content: encrypt('Today was challenging with three continuous lectures, but I took a 20-minute walk by the lake afterward. Watching the sunset helped my mind quiet down. Grateful for simple moments.'),
      mood: 'grateful',
      isEncrypted: true,
      sharedWithMentor: true,
    },
    {
      userId: primaryStudent._id,
      content: encrypt('Felt a sudden wave of panic about project submissions next week. Practiced the 4-7-8 breathing exercise Dr. Aris suggested. My breathing normalized and I was able to get some restful sleep.'),
      mood: 'neutral',
      isEncrypted: true,
      sharedWithMentor: true,
    },
    {
      userId: primaryStudent._id,
      content: encrypt('Had a truly uplifting chat with my mentor today! They shared stories from their university years and gave me perspective on pacing myself. Feeling much more confident.'),
      mood: 'happy',
      isEncrypted: true,
      sharedWithMentor: true,
    },
    {
      userId: secondaryStudent._id,
      content: encrypt('Low energy day. Struggled with a difficult bug for 5 hours. Decided to close the laptop and cook a nutritious dinner instead of spiraling into frustration.'),
      mood: 'sad',
      isEncrypted: true,
      sharedWithMentor: true,
    },
    {
      userId: secondaryStudent._id,
      content: encrypt('Cracked the algorithm problem this morning! It felt great to see the test cases pass after taking a break. Taking rests really does help problem solving.'),
      mood: 'happy',
      isEncrypted: true,
      sharedWithMentor: true,
    },
  ];

  for (const entry of diaryEntries) {
    await DiaryEntry.create(entry);
  }
  console.log(`Seeded ${diaryEntries.length} encrypted diary entries.`);

  // 5. Seed Encouragement Notes
  const notes = [
    {
      authorId: primaryMentor._id,
      message: 'Remember: progress is rarely linear. Every small step forward, even resting, is part of your journey.',
    },
    {
      authorId: techMentor._id,
      message: 'You belong in this field. Don’t let temporary setbacks define your long-term potential.',
    },
  ];

  for (const n of notes) {
    await EncouragementNote.findOneAndUpdate(
      { message: n.message },
      { $set: n },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  }
  console.log(`Seeded ${notes.length} encouragement notes.`);

  console.log('✅ Database seeding finished successfully!');
}

seedData()
  .catch((err) => {
    console.error('❌ Seeding error:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
    }
  });
