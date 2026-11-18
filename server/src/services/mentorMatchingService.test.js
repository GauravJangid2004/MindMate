const assert = require('node:assert/strict');
const { afterEach, test } = require('node:test');
const { matchMentorsWithWeightedScoring } = require('./mentorMatchingService');
const { chatMentorAssistant } = require('./geminiService');
const {
  EMBEDDING_MODEL,
  RERANK_MODEL,
  embedTexts,
  parseEmbeddingResponse,
  parseHuggingFaceResponse,
} = require('./qwenInferenceService');

const originalFetch = global.fetch;
const originalEnvironment = {
  QWEN_EMBEDDING_URL: process.env.QWEN_EMBEDDING_URL,
  QWEN_EMBEDDING_API_KEY: process.env.QWEN_EMBEDDING_API_KEY,
  QWEN_EMBEDDING_MODEL: process.env.QWEN_EMBEDDING_MODEL,
  QWEN_RERANK_URL: process.env.QWEN_RERANK_URL,
  QWEN_RERANK_API_KEY: process.env.QWEN_RERANK_API_KEY,
  QWEN_RERANK_MODEL: process.env.QWEN_RERANK_MODEL,
  GEMINI_API_KEY: process.env.GEMINI_API_KEY,
};

afterEach(() => {
  global.fetch = originalFetch;
  for (const [key, value] of Object.entries(originalEnvironment)) {
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

test('embedding parser restores input order and rejects mismatched vectors', () => {
  const parsed = parseEmbeddingResponse(
    {
      data: [
        { index: 1, embedding: [0, 1] },
        { index: 0, embedding: [1, 0] },
      ],
    },
    2
  );
  assert.deepEqual(parsed, [[1, 0], [0, 1]]);

  assert.throws(
    () =>
      parseEmbeddingResponse(
        {
          data: [
            { index: 0, embedding: [1, 0] },
            { index: 1, embedding: [0, 1, 2] },
          ],
        },
        2
      ),
    /invalid vectors/i
  );
});

test('embedding uses the local Ollama Qwen model by default', async () => {
  delete process.env.QWEN_EMBEDDING_URL;
  delete process.env.QWEN_EMBEDDING_API_KEY;
  global.fetch = async (url, options) => {
    assert.equal(url, 'http://127.0.0.1:11434/api/embed');
    const body = JSON.parse(options.body);
    assert.equal(body.model, EMBEDDING_MODEL);
    assert.deepEqual(body.input, ['student support needs']);
    return {
      ok: true,
      json: async () => ({ embeddings: [[0.1, 0.9]] }),
    };
  };

  assert.deepEqual(await embedTexts(['student support needs']), [[0.1, 0.9]]);
});

test('missing Ollama model returns a setup instruction', async () => {
  delete process.env.QWEN_EMBEDDING_URL;
  global.fetch = async () => ({
    ok: false,
    status: 404,
  });

  await assert.rejects(embedTexts(['student support needs']), {
    statusCode: 503,
    message: /ollama pull qwen3-embedding:0\.6b/i,
  });
});

test('mentor matching uses Qwen vectors and respects reranker order', async () => {
  process.env.QWEN_EMBEDDING_URL = 'https://embedding.example/v1/embeddings';
  process.env.QWEN_EMBEDDING_MODEL = 'Qwen/Qwen3-Embedding-0.6B';
  process.env.QWEN_RERANK_URL = 'https://reranker.example/v1/rerank';
  delete process.env.GEMINI_API_KEY;

  global.fetch = async (url, options) => {
    const body = JSON.parse(options.body);
    if (url === process.env.QWEN_EMBEDDING_URL) {
      assert.equal(body.model, EMBEDDING_MODEL);
      assert.equal(body.input.length, 3);
      return {
        ok: true,
        json: async () => ({
          data: [
            { index: 0, embedding: [1, 0] },
            { index: 1, embedding: [0.9, 0.1] },
            { index: 2, embedding: [0.8, 0.2] },
          ],
        }),
      };
    }

    assert.equal(url, process.env.QWEN_RERANK_URL);
    return {
      ok: true,
      json: async () => ({
        results: [
          { index: 1, relevance_score: 0.9 },
          { index: 0, relevance_score: 0.2 },
        ],
      }),
    };
  };

  const result = await matchMentorsWithWeightedScoring({
    studentNeeds: 'I am looking for career guidance.',
    studentProfile: { course: 'Design', hobbies: ['drawing'] },
    mentors: [
      {
        _id: 'mentor-a',
        anonymousHandle: 'KindMaple',
        passion: 'Career coaching',
        hobbies: ['drawing'],
        isVerified: true,
      },
      {
        _id: 'mentor-b',
        anonymousHandle: 'CalmWillow',
        passion: 'Career support',
        hobbies: ['reading'],
        isVerified: true,
      },
    ],
  });

  assert.equal(result.recommendations[0].mentor._id, 'mentor-b');
  assert.equal(result.recommendations[0].metrics.rerankerRank, 1);
  assert.equal(result.recommendations[1].metrics.rerankerRank, 2);
  assert.equal(result.models.embeddings, EMBEDDING_MODEL);
  assert.equal(result.models.reranker, RERANK_MODEL);
  assert.ok(result.recommendations.every((item) => item.matchPercentage >= 0));
});

test('embedding parser handles Hugging Face 2D array and mean pooling', () => {
  const vectors = parseHuggingFaceResponse([[0.1, 0.9], [0.8, 0.2]], 2);
  assert.deepEqual(vectors, [[0.1, 0.9], [0.8, 0.2]]);

  // Single 1D vector fallback
  const single = parseHuggingFaceResponse([0.5, 0.5], 1);
  assert.deepEqual(single, [[0.5, 0.5]]);

  // 3D token pooling
  const pooled = parseHuggingFaceResponse([[[1, 0], [0, 2]]], 1);
  assert.deepEqual(pooled, [[0.5, 1]]);
});

test('embedding calls Hugging Face Inference API when configured', async () => {
  process.env.QWEN_EMBEDDING_URL = 'https://router.huggingface.co/hf-inference/models/Qwen/Qwen3-Embedding-0.6B';
  process.env.QWEN_EMBEDDING_API_KEY = 'hf_mock_token_123';

  global.fetch = async (url, options) => {
    assert.equal(
      url,
      'https://router.huggingface.co/hf-inference/models/Qwen/Qwen3-Embedding-0.6B/pipeline/feature-extraction'
    );
    assert.equal(options.headers['Authorization'], 'Bearer hf_mock_token_123');
    assert.equal(options.headers['x-wait-for-model'], 'true');
    const body = JSON.parse(options.body);
    assert.deepEqual(body.inputs, ['student support needs']);
    return {
      ok: true,
      json: async () => [[0.4, 0.6]],
    };
  };

  const result = await embedTexts(['student support needs']);
  assert.deepEqual(result, [[0.4, 0.6]]);
});

test('chatMentorAssistant provides empathetic fallback advice and icebreakers', async () => {
  delete process.env.GEMINI_API_KEY;

  const response = await chatMentorAssistant({
    message: 'What should I say in my first message to a mentor?',
    mentors: [{ anonymousHandle: 'Elder Priya', passion: 'Mindfulness & Exam Stress', hobbies: ['Yoga'] }],
  });

  assert.ok(response.reply.length > 20);
  assert.equal(response.source, 'local fallback');
  assert.ok(Array.isArray(response.suggestedPrompts));
  assert.ok(response.suggestedPrompts.length > 0);
});

test('chatMentorAssistant provides emergency crisis helpline on danger keywords', async () => {
  delete process.env.GEMINI_API_KEY;

  const response = await chatMentorAssistant({
    message: 'I want to end my life, everything is too painful',
  });

  assert.ok(response.reply.includes('14416') || response.reply.includes('Tele-MANAS'));
  assert.equal(response.source, 'local fallback');
});
