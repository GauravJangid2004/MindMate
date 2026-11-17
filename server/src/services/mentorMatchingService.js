const geminiService = require('./geminiService');
const {
  EMBEDDING_MODEL,
  embedTexts,
  rerankDocuments,
} = require('./qwenInferenceService');

function cosineSimilarity(vecA, vecB) {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) {
    return 0;
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i += 1) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }

  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

function setSimilarity(arrA = [], arrB = []) {
  if (!arrA.length || !arrB.length) return 0;
  const setA = new Set(arrA.map((value) => value.toLowerCase().trim()));
  const setB = new Set(arrB.map((value) => value.toLowerCase().trim()));
  const intersection = [...setA].filter((value) => setB.has(value)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

function domainAlignment(studentCourse = '', studentNeeds = '', mentorPassion = '') {
  const studentText = `${studentCourse} ${studentNeeds}`.toLowerCase();
  const mentorText = (mentorPassion || '').toLowerCase();
  const keywords = [
    'engineering', 'technology', 'coding', 'science', 'math', 'medical',
    'health', 'arts', 'business', 'commerce', 'exam', 'stress', 'hostel',
    'career', 'interview', 'anxiety', 'lonely', 'family', 'burnout', 'motivation',
  ];
  const matches = keywords.filter(
    (keyword) => studentText.includes(keyword) && mentorText.includes(keyword)
  ).length;

  return Math.min(1, matches / 3);
}

function normalizeText(value) {
  return typeof value === 'string' ? value.trim() : '';
}

function mentorText(mentor) {
  return [
    `Mentor experience: ${normalizeText(mentor.passion)}`,
    `Interests: ${(mentor.hobbies || []).join(', ')}`,
  ]
    .filter(Boolean)
    .join('. ');
}

function idFor(mentor) {
  return mentor._id?.toString() || mentor.id?.toString();
}

async function matchMentorsWithWeightedScoring({
  studentNeeds = '',
  studentProfile = {},
  mentors = [],
}) {
  if (!mentors.length) {
    return {
      needsAnalysis: null,
      recommendations: [],
      models: { embeddings: EMBEDDING_MODEL, reranker: null, generation: 'not used' },
    };
  }

  const needsAnalysis = await geminiService.analyzeUserNeeds(studentNeeds);
  const studentText = `Instruct: Match a student's wellbeing support needs to the most relevant mentor profile.
Query: Student needs: ${studentNeeds}. Study field: ${normalizeText(studentProfile.course)}. Interests: ${(studentProfile.hobbies || []).join(', ')}. Themes: ${(needsAnalysis.themes || []).join(', ')}.`;
  const mentorTexts = mentors.map(mentorText);
  const vectors = await embedTexts([studentText, ...mentorTexts]);
  const studentVector = vectors[0];
  const studentHobbies = studentProfile.hobbies || [];

  const scoredMentors = mentors.map((mentor, index) => {
    const semanticSimilarity = Math.max(
      0,
      Math.min(1, cosineSimilarity(studentVector, vectors[index + 1]))
    );
    const hobbiesSimilarity = setSimilarity(studentHobbies, mentor.hobbies || []);
    const domainSimilarity = domainAlignment(
      studentProfile.course,
      studentNeeds,
      mentor.passion
    );
    const reliability = mentor.isVerified ? 1 : 0;
    const score =
      0.55 * semanticSimilarity +
      0.2 * hobbiesSimilarity +
      0.15 * domainSimilarity +
      0.1 * reliability;
    const sharedHobbies = (mentor.hobbies || []).filter((hobby) =>
      studentHobbies.some(
        (studentHobby) => studentHobby.toLowerCase() === hobby.toLowerCase()
      )
    );

    return {
      mentor: typeof mentor.toSafeJSON === 'function' ? mentor.toSafeJSON() : mentor,
      sourceIndex: index,
      score,
      matchPercentage: Math.round(score * 100),
      metrics: {
        semanticScore: Math.round(semanticSimilarity * 100),
        hobbiesScore: Math.round(hobbiesSimilarity * 100),
        domainScore: Math.round(domainSimilarity * 100),
      },
      sharedHobbies,
      matchedThemes: needsAnalysis.themes || [],
      matchReason: '',
    };
  });

  scoredMentors.sort((a, b) => b.score - a.score);
  const rerankResults = await rerankDocuments(
    studentText,
    scoredMentors.map((item) => mentorTexts[item.sourceIndex])
  );

  if (rerankResults) {
    const rankByCandidateIndex = new Map(
      rerankResults.map((item, rank) => [item.index, rank])
    );
    scoredMentors.forEach((item, candidateIndex) => {
      item.rerankerOrder =
        rankByCandidateIndex.get(candidateIndex) ?? candidateIndex;
      item.metrics.rerankerRank = item.rerankerOrder + 1;
    });
    scoredMentors.sort(
      (a, b) => a.rerankerOrder - b.rerankerOrder || b.score - a.score
    );
  }

  const explanationResult = await geminiService.explainMentorMatches(
    needsAnalysis,
    scoredMentors.slice(0, 5).map((item) => ({
      id: idFor(item.mentor),
      anonymousHandle: item.mentor.anonymousHandle,
      passion: item.mentor.passion,
      hobbies: item.mentor.hobbies,
      sharedHobbies: item.sharedHobbies,
    }))
  );
  const explanations = new Map(
    explanationResult.recommendations.map((item) => [item.id, item.reason])
  );

  scoredMentors.forEach((item) => {
    const reason = explanations.get(idFor(item.mentor));
    item.matchReasonSource = reason ? 'gemini' : 'local fallback';
    item.matchReason =
      reason ||
      (item.sharedHobbies.length
        ? `You both enjoy ${item.sharedHobbies.join(', ')}.`
        : item.mentor.passion
          ? `Their experience in ${item.mentor.passion} may relate to your needs.`
          : 'This verified mentor may be a supportive person to talk with.');
    delete item.score;
    delete item.sourceIndex;
    delete item.rerankerOrder;
  });

  return {
    needsAnalysis,
    recommendations: scoredMentors,
    models: {
      embeddings: EMBEDDING_MODEL,
      reranker: rerankResults ? process.env.QWEN_RERANK_MODEL || 'Qwen/Qwen3-Reranker-0.6B' : null,
      generation:
        needsAnalysis.source === 'gemini' || explanationResult.source === 'gemini'
          ? process.env.GEMINI_MODEL || 'gemini-2.0-flash-lite'
          : 'local fallback',
    },
  };
}

module.exports = {
  cosineSimilarity,
  matchMentorsWithWeightedScoring,
};
