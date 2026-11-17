const { GoogleGenAI } = require('@google/genai');
const logger = require('../utils/logger');

// Configurable model name — defaults to Gemini Flash-Lite series
const GEMINI_MODEL = process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite';
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || '';

let aiClient = null;

function getClient() {
  if (!aiClient && GEMINI_API_KEY) {
    try {
      aiClient = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    } catch (err) {
      logger.error(`Failed to initialize GoogleGenAI: ${err.message}`);
    }
  }
  return aiClient;
}

/**
 * Helper to call Gemini generateContent safely with fallback
 */
async function callGemini(prompt, systemInstruction = '', jsonMode = false) {
  const client = getClient();
  if (!client) {
    logger.warn('GEMINI_API_KEY not configured. Using local fallback engine.');
    return null;
  }

  try {
    const config = {};
    if (systemInstruction) {
      config.systemInstruction = systemInstruction;
    }
    if (jsonMode) {
      config.responseMimeType = 'application/json';
    }

    const response = await client.models.generateContent({
      model: GEMINI_MODEL,
      contents: prompt,
      config,
    });

    const text = response.text || '';
    if (jsonMode) {
      try {
        return JSON.parse(text);
      } catch (e) {
        // Fallback cleanup if model wrapped JSON in markdown code fences
        const cleaned = text.replace(/```json\n?|```/g, '').trim();
        return JSON.parse(cleaned);
      }
    }
    return text.trim();
  } catch (error) {
    logger.error(`Gemini Flash-Lite API error (${GEMINI_MODEL}): ${error.message}`);
    return null;
  }
}

/**
 * 1. Mentor Matching Support: Extract intent & themes from user's stated needs
 */
async function analyzeUserNeeds(userNeedsText) {
  const prompt = `Analyze this student's situation and mental wellbeing needs:
"${userNeedsText}"

Extract:
1. Core themes (e.g., academic anxiety, career confusion, loneliness, relationship stress, burnout)
2. Desired mentor qualities or background
3. Keywords for search`;

  const system = `You are an empathetic matching assistant for MindMate, an anonymous student mental wellbeing support platform. Return JSON in this exact structure:
{
  "themes": string[],
  "desiredMentorQualities": string[],
  "keywords": string[],
  "summary": string
}`;

  const result = await callGemini(prompt, system, true);
  if (result) return { ...result, source: 'gemini' };

  // Local fallback
  const words = (userNeedsText || '').toLowerCase();
  const fallbackThemes = [];
  if (words.includes('exam') || words.includes('study') || words.includes('grade') || words.includes('college')) {
    fallbackThemes.push('Academic Stress');
  }
  if (words.includes('alone') || words.includes('lonely') || words.includes('friend') || words.includes('homesick')) {
    fallbackThemes.push('Loneliness & Adjustment');
  }
  if (words.includes('job') || words.includes('career') || words.includes('future') || words.includes('interview')) {
    fallbackThemes.push('Career Uncertainty');
  }
  if (words.includes('anxious') || words.includes('panic') || words.includes('stress') || words.includes('sleep')) {
    fallbackThemes.push('Anxiety & Wellbeing');
  }
  if (fallbackThemes.length === 0) fallbackThemes.push('General Wellbeing');

  return {
    themes: fallbackThemes,
    desiredMentorQualities: ['Empathetic listener', 'Experienced guide'],
    keywords: userNeedsText.split(/\s+/).filter((w) => w.length > 4).slice(0, 5),
    summary: userNeedsText.slice(0, 120),
    source: 'local fallback',
  };
}

/**
 * 2. Profile Tagging: Extract topics, interests, skills, and life experiences
 */
async function extractProfileTags(profileData) {
  const { passion, hobbies = [], course, bio, userType } = profileData;
  const prompt = `Extract standardized topics, skills, interests, and life experiences from this user profile:
Role: ${userType || 'student'}
Course/Field: ${course || 'Not specified'}
Passion/Bio: ${passion || bio || 'Not specified'}
Existing hobbies: ${hobbies.join(', ') || 'None provided'}

Generate concise, relevant tags (maximum 8 tags total).`;

  const system = `You are a profile tagging engine for MindMate. Return JSON with format:
{
  "tags": string[],
  "categories": {
    "interests": string[],
    "skills": string[],
    "lifeExperiences": string[]
  }
}`;

  const result = await callGemini(prompt, system, true);
  if (result) return result;

  // Local fallback
  const combinedTags = new Set(hobbies);
  if (course) combinedTags.add(course);
  if (passion) {
    passion.split(/[,.;]/).forEach((p) => {
      const trimmed = p.trim();
      if (trimmed.length > 2 && trimmed.length < 30) combinedTags.add(trimmed);
    });
  }
  const tagList = Array.from(combinedTags).slice(0, 8);
  return {
    tags: tagList,
    categories: {
      interests: hobbies,
      skills: course ? [course] : [],
      lifeExperiences: passion ? [passion] : [],
    },
  };
}

/**
 * 3. Wisdom Wall Categorization: Categorize mentors' stories and life lessons
 */
async function categorizeWisdom(storyContent, title = '') {
  const categories = [
    'Academic Stress',
    'Loneliness',
    'Mental Health',
    'Career',
    'Relationships',
    'Adjustment',
    'Personal Growth',
    'General',
  ];

  const prompt = `Title: ${title}
Content: "${storyContent}"

Select the single best category from this list: ${categories.join(', ')}.
Provide a confidence score between 0 and 1, and 2-3 secondary sub-topics.`;

  const system = `You categorize mental wellbeing stories and mentor life lessons. Return JSON:
{
  "category": string,
  "confidence": number,
  "subTopics": string[],
  "reasoning": string
}`;

  const result = await callGemini(prompt, system, true);
  if (result && categories.includes(result.category)) return result;

  // Local heuristic fallback
  const lower = (title + ' ' + storyContent).toLowerCase();
  let matched = 'General';
  if (/exam|study|grade|college|professor|failure|gpa|marks/.test(lower)) matched = 'Academic Stress';
  else if (/lonely|friend|isolated|alone|homesick|roommate/.test(lower)) matched = 'Loneliness';
  else if (/career|job|interview|resume|future|salary|industry/.test(lower)) matched = 'Career';
  else if (/relationship|family|parents|breakup|partner|love/.test(lower)) matched = 'Relationships';
  else if (/anxiety|depression|therapy|panic|mental|sad/.test(lower)) matched = 'Mental Health';
  else if (/growth|habit|discipline|learn|wisdom|mindset/.test(lower)) matched = 'Personal Growth';
  else if (/adapt|new city|hostel|culture|change/.test(lower)) matched = 'Adjustment';

  return {
    category: matched,
    confidence: 0.85,
    subTopics: [matched, 'Life Lessons'],
    reasoning: 'Categorized based on primary narrative themes.',
  };
}

/**
 * 4. Story Summarization: Create short summaries of shared experiences
 */
async function summarizeStory(storyContent) {
  const prompt = `Summarize this shared experience/story into 1-2 empathetic, inspiring sentences capturing the core message and takeaway:
"${storyContent}"`;

  const system = `You summarize lived experiences for a peer mental wellbeing community. Return JSON:
{
  "summary": string,
  "keyTakeaway": string,
  "readingTimeMinutes": number
}`;

  const result = await callGemini(prompt, system, true);
  if (result) return result;

  // Local fallback
  const sentences = storyContent.split(/[.!?]+/).filter((s) => s.trim().length > 10);
  const summary = sentences.slice(0, 2).join('. ').trim() + (sentences.length > 0 ? '.' : '');
  const wordCount = storyContent.split(/\s+/).length;
  return {
    summary: summary || storyContent.slice(0, 140) + '...',
    keyTakeaway: 'Every challenge is an opportunity to learn and grow with support.',
    readingTimeMinutes: Math.max(1, Math.round(wordCount / 180)),
  };
}

/**
 * 5. Micro-Guidance Formatting: Organize mentor advice into clear, actionable points
 */
async function formatMicroGuidance(adviceText) {
  const prompt = `Mentor's raw advice:
"${adviceText}"

Transform this advice into structured micro-guidance with:
1. A warm 1-sentence headline/core insight
2. 3-4 concrete, gentle, bite-sized action steps (immediate things the student can do today)
3. A reflective closing thought`;

  const system = `You format mentor advice for stressed students. The tone must be supportive, clear, actionable, and non-overwhelming. Return JSON:
{
  "headline": string,
  "actionSteps": string[],
  "reflectiveThought": string
}`;

  const result = await callGemini(prompt, system, true);
  if (result) return result;

  // Local fallback
  const lines = adviceText.split(/[\n.]+/)
    .map((l) => l.trim())
    .filter((l) => l.length > 15);

  return {
    headline: lines[0] || 'Take small, mindful steps toward clarity.',
    actionSteps: lines.length > 1 ? lines.slice(1, 4) : [
      'Take 3 deep, slow breaths before beginning your next task.',
      'Write down what you can control right now on a piece of paper.',
      'Reach out to one person or write in your diary when feeling overwhelmed.',
    ],
    reflectiveThought: 'You do not have to solve everything all at once. Progress happens one gentle step at a time.',
  };
}

/**
 * 6. Multilingual Support: Translate messages and content while preserving empathetic tone
 */
async function translateText(text, targetLanguage) {
  const prompt = `Translate this mental wellbeing text into ${targetLanguage}.
Maintain a warm, reassuring, respectful, and culturally sensitive tone:
"${text}"`;

  const system = `You are an empathetic multilingual translator for MindMate. Return JSON:
{
  "originalText": string,
  "translatedText": string,
  "targetLanguage": string
}`;

  const result = await callGemini(prompt, system, true);
  if (result) return result;

  // If Gemini API is not connected, provide helpful notice
  return {
    originalText: text,
    translatedText: `[Translation to ${targetLanguage}]: ${text}`,
    targetLanguage,
    note: 'Configure GEMINI_API_KEY in server/.env for live multi-language translation.',
  };
}

/**
 * 7. Conversation Starters: Suggest icebreaker questions for student & mentor
 */
async function generateConversationStarters(studentProfile = {}, mentorProfile = {}) {
  const prompt = `Suggest 4 friendly, gentle conversation starter questions for an anonymous student and mentor connecting for the first time.
Student info: Course: ${studentProfile.course || 'College Student'}, Hobbies: ${(studentProfile.hobbies || []).join(', ') || 'General'}
Mentor info: Passion: ${mentorProfile.passion || 'Experienced Guide'}, Hobbies: ${(mentorProfile.hobbies || []).join(', ') || 'Reading, Mentoring'}`;

  const system = `You provide comfortable, non-intrusive icebreaker questions for MindMate. Return JSON:
{
  "starters": [
    {
      "topic": string,
      "question": string
    }
  ]
}`;

  const result = await callGemini(prompt, system, true);
  const validStarters = Array.isArray(result?.starters)
    ? result.starters
        .filter(
          (starter) =>
            starter &&
            typeof starter.topic === 'string' &&
            typeof starter.question === 'string'
        )
        .slice(0, 4)
    : [];
  if (validStarters.length) {
    return { starters: validStarters, source: 'gemini' };
  }

  // Local fallback
  return {
    starters: [
      {
        topic: 'Getting Started',
        question: "Hi there! I saw we both enjoy similar interests. How has your week been going?",
      },
      {
        topic: 'Balancing Life',
        question: "How do you usually handle days when everything feels like it's piling up at once?",
      },
      {
        topic: 'Experience & Advice',
        question: "What is one piece of advice you wish you knew when you were facing college or big transitions?",
      },
      {
        topic: 'Current Mood',
        question: "I've been feeling a bit overwhelmed lately and wanted someone to talk to. Do you have time for a chat?",
      },
    ],
    source: 'local fallback',
  };
}

async function explainMentorMatches(needsAnalysis, mentors = []) {
  if (!mentors.length) {
    return { recommendations: [], source: 'local fallback' };
  }

  const prompt = `Suggest a supportive mentor match for these generalized student themes:
${(needsAnalysis.themes || []).join(', ') || 'General wellbeing'}
Desired mentor qualities: ${(needsAnalysis.desiredMentorQualities || []).join(', ') || 'empathetic listener'}

Candidates:
${JSON.stringify(mentors)}

For each candidate, return one concise, evidence-based reason (maximum 180 characters).
Do not infer qualifications, clinical expertise, or personal facts not present in the candidate profile.`;

  const result = await callGemini(
    prompt,
    `You help students choose peer-support mentors. Return JSON in this exact structure:
{
  "recommendations": [
    { "id": "candidate id", "reason": "brief reason based only on supplied themes and profile" }
  ]
}`,
    true
  );

  if (!Array.isArray(result?.recommendations)) {
    return { recommendations: [], source: 'local fallback' };
  }
  const allowedIds = new Set(mentors.map((mentor) => mentor.id));
  return {
    recommendations: result.recommendations.filter(
      (item) =>
        item &&
        allowedIds.has(item.id) &&
        typeof item.reason === 'string' &&
        item.reason.trim().length > 0
    ),
    source: 'gemini',
  };
}

/**
 * 8. Content Moderation Support: Flag potentially harmful or inappropriate content
 */
async function moderateContent(content) {
  const prompt = `Analyze this text for a student mental wellbeing platform:
"${content}"

Evaluate:
1. Is it safe or harmful?
2. Does it express imminent self-harm or suicide crisis?
3. Does it contain harassment, hate speech, bullying, or abusive behavior?
4. Severity level: "safe", "low", "medium", or "critical"`;

  const system = `You are a content safety and crisis intervention moderation engine for MindMate. Return JSON:
{
  "flagged": boolean,
  "severity": "safe" | "low" | "medium" | "critical",
  "crisisDetected": boolean,
  "categories": string[],
  "explanation": string,
  "action": "allow" | "flag_for_review" | "block_and_show_helpline"
}`;

  const result = await callGemini(prompt, system, true);
  if (result) return result;

  // Robust keyword heuristic fallback
  const lower = (content || '').toLowerCase();
  const crisisKeywords = [
    'suicide', 'kill myself', 'end my life', 'want to die',
    'self harm', 'self-harm', 'cutting', 'overdose', 'no reason to live'
  ];
  const harmfulKeywords = [
    'hate', 'kill you', 'die', 'threat', 'stupid idiot', 'trash'
  ];

  const hasCrisis = crisisKeywords.some((k) => lower.includes(k));
  const hasHarm = harmfulKeywords.some((k) => lower.includes(k));

  if (hasCrisis) {
    return {
      flagged: true,
      severity: 'critical',
      crisisDetected: true,
      categories: ['self-harm', 'crisis'],
      explanation: 'Text contains indicators of emotional distress or self-harm.',
      action: 'block_and_show_helpline',
    };
  }

  if (hasHarm) {
    return {
      flagged: true,
      severity: 'medium',
      crisisDetected: false,
      categories: ['harassment'],
      explanation: 'Content flagged for potentially hostile language.',
      action: 'flag_for_review',
    };
  }

  return {
    flagged: false,
    severity: 'safe',
    crisisDetected: false,
    categories: [],
    explanation: 'Content passed automated safety checks.',
    action: 'allow',
  };
}

module.exports = {
  GEMINI_MODEL,
  callGemini,
  analyzeUserNeeds,
  extractProfileTags,
  categorizeWisdom,
  summarizeStory,
  formatMicroGuidance,
  translateText,
  generateConversationStarters,
  explainMentorMatches,
  moderateContent,
};
