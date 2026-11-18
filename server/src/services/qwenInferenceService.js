const DEFAULT_OLLAMA_EMBEDDING_URL = 'http://127.0.0.1:11434/api/embed';
const DEFAULT_HF_EMBEDDING_URL =
  'https://router.huggingface.co/hf-inference/models/Qwen/Qwen3-Embedding-0.6B/pipeline/feature-extraction';

const EMBEDDING_MODEL =
  process.env.QWEN_EMBEDDING_MODEL ||
  (process.env.QWEN_EMBEDDING_URL
    ? 'Qwen/Qwen3-Embedding-0.6B'
    : 'qwen3-embedding:0.6b');
const RERANK_MODEL =
  process.env.QWEN_RERANK_MODEL || 'Qwen/Qwen3-Reranker-0.6B';

function createProviderError(message, statusCode = 503) {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
}

function getProviderType(url) {
  try {
    const parsed = new URL(url);
    if (parsed.hostname.includes('huggingface.co')) {
      return 'huggingface';
    }
    if (parsed.pathname.replace(/\/+$/, '') === '/api/embed') {
      return 'ollama';
    }
    return 'openai';
  } catch {
    return 'unknown';
  }
}

function normalizeHuggingFaceUrl(url, modelName) {
  try {
    const parsed = new URL(url);
    let pathname = parsed.pathname.replace(/\/+$/, '');
    if (pathname === '' || pathname === '/') {
      pathname = `/hf-inference/models/${modelName || 'Qwen/Qwen3-Embedding-0.6B'}/pipeline/feature-extraction`;
    } else if (!pathname.endsWith('/pipeline/feature-extraction')) {
      pathname = `${pathname}/pipeline/feature-extraction`;
    }
    parsed.pathname = pathname;
    return parsed.toString();
  } catch {
    return url;
  }
}

async function postJson(url, apiKey, body, serviceName, extraHeaders = {}) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
        ...extraHeaders,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(60000),
    });
  } catch (error) {
    if (error.name === 'TimeoutError' || error.name === 'AbortError') {
      throw createProviderError(`${serviceName} request timed out.`, 502);
    }
    const isDefaultOllama =
      url === DEFAULT_OLLAMA_EMBEDDING_URL && serviceName === 'Qwen embedding';
    throw createProviderError(
      isDefaultOllama
        ? 'Local Ollama is not running. Install/start Ollama, then run `ollama pull qwen3-embedding:0.6b`.'
        : `${serviceName} endpoint could not be reached. Start the inference service and verify its URL.`,
      503
    );
  }

  if (!response.ok) {
    if (
      url === DEFAULT_OLLAMA_EMBEDDING_URL &&
      serviceName === 'Qwen embedding' &&
      [400, 404].includes(response.status)
    ) {
      throw createProviderError(
        'The Qwen embedding model is missing from Ollama. Run `ollama pull qwen3-embedding:0.6b`.',
        503
      );
    }

    let errorDetail = '';
    try {
      const errorJson = await response.json();
      if (errorJson?.error) {
        errorDetail = `: ${typeof errorJson.error === 'string' ? errorJson.error : JSON.stringify(errorJson.error)}`;
      } else if (errorJson?.message) {
        errorDetail = `: ${errorJson.message}`;
      }
    } catch {
      // not json, leave empty
    }

    throw createProviderError(
      `${serviceName} endpoint returned HTTP ${response.status}${errorDetail}.`,
      response.status === 401 ? 401 : 502
    );
  }

  try {
    return await response.json();
  } catch {
    throw createProviderError(`${serviceName} endpoint returned invalid JSON.`, 502);
  }
}

function parseHuggingFaceResponse(payload, expectedCount) {
  if (!Array.isArray(payload)) {
    if (payload?.error) {
      throw createProviderError(`Hugging Face inference error: ${payload.error}`, 502);
    }
    throw createProviderError(
      'Hugging Face embedding response was not an array of vectors.',
      502
    );
  }

  // Handle single input case where HF might return 1D array: [0.1, 0.2, ...]
  if (expectedCount === 1 && payload.length > 0 && typeof payload[0] === 'number') {
    return [payload];
  }

  if (payload.length !== expectedCount) {
    throw createProviderError(
      `Hugging Face returned ${payload.length} vectors, expected ${expectedCount}.`,
      502
    );
  }

  // Handle potential 3D array: [[[token1], [token2], ...]] by average pooling
  const embeddings = payload.map((item) => {
    if (Array.isArray(item) && Array.isArray(item[0])) {
      const dim = item[0].length;
      const pooled = new Array(dim).fill(0);
      for (const token of item) {
        for (let i = 0; i < dim; i++) {
          pooled[i] += token[i];
        }
      }
      return pooled.map((val) => val / item.length);
    }
    return item;
  });

  const dimension = embeddings[0]?.length;
  if (
    !Number.isInteger(dimension) ||
    dimension < 1 ||
    embeddings.some(
      (vector) =>
        !Array.isArray(vector) ||
        vector.length !== dimension ||
        vector.some((value) => !Number.isFinite(value))
    )
  ) {
    throw createProviderError('Hugging Face embedding response contained invalid vectors.', 502);
  }

  return embeddings;
}

function parseEmbeddingResponse(payload, expectedCount) {
  const rows = payload?.data;
  if (!Array.isArray(rows) || rows.length !== expectedCount) {
    throw createProviderError(
      'Qwen embedding response did not contain one vector per input.',
      502
    );
  }

  const indexes = rows.map((row, position) => row?.index ?? position);
  if (
    indexes.some(
      (index) => !Number.isInteger(index) || index < 0 || index >= expectedCount
    ) ||
    new Set(indexes).size !== expectedCount
  ) {
    throw createProviderError('Qwen embedding response contained invalid indexes.', 502);
  }

  const orderedRows = [...rows].sort(
    (left, right) => (left?.index ?? 0) - (right?.index ?? 0)
  );
  const embeddings = orderedRows.map((row) => row?.embedding);
  const dimension = embeddings[0]?.length;

  if (
    !Number.isInteger(dimension) ||
    dimension < 1 ||
    embeddings.some(
      (vector) =>
        !Array.isArray(vector) ||
        vector.length !== dimension ||
        vector.some((value) => !Number.isFinite(value))
    )
  ) {
    throw createProviderError('Qwen embedding response contained invalid vectors.', 502);
  }

  return embeddings;
}

async function embedTexts(inputTexts) {
  if (!inputTexts.length) return [];

  const rawUrl = process.env.QWEN_EMBEDDING_URL || DEFAULT_OLLAMA_EMBEDDING_URL;
  let provider;
  try {
    new URL(rawUrl);
    provider = getProviderType(rawUrl);
  } catch {
    throw createProviderError('QWEN_EMBEDDING_URL must be a valid URL.', 503);
  }

  const apiKey =
    process.env.QWEN_EMBEDDING_API_KEY ||
    process.env.HF_TOKEN ||
    process.env.HUGGINGFACE_API_KEY ||
    '';

  // 1. Hugging Face Inference API
  if (provider === 'huggingface') {
    const targetUrl = normalizeHuggingFaceUrl(rawUrl, EMBEDDING_MODEL);
    const payload = await postJson(
      targetUrl,
      apiKey,
      {
        inputs: inputTexts,
        options: { wait_for_model: true },
      },
      'Hugging Face Qwen embedding',
      { 'x-wait-for-model': 'true' }
    );
    return parseHuggingFaceResponse(payload, inputTexts.length);
  }

  // 2. Local Ollama
  if (provider === 'ollama') {
    const payload = await postJson(
      rawUrl,
      apiKey,
      { model: EMBEDDING_MODEL, input: inputTexts, truncate: true, keep_alive: -1 },
      'Qwen embedding'
    );
    const embeddings = payload?.embeddings;
    const dimension = embeddings?.[0]?.length;
    if (
      !Array.isArray(embeddings) ||
      embeddings.length !== inputTexts.length ||
      !Number.isInteger(dimension) ||
      dimension < 1 ||
      embeddings.some(
        (vector) =>
          !Array.isArray(vector) ||
          vector.length !== dimension ||
          vector.some((value) => !Number.isFinite(value))
      )
    ) {
      throw createProviderError(
        'Ollama embedding response did not contain valid vectors for every input.',
        502
      );
    }
    return embeddings;
  }

  // 3. OpenAI-compatible hosted provider
  const payload = await postJson(
    rawUrl,
    apiKey,
    {
      model: EMBEDDING_MODEL,
      input: inputTexts,
      encoding_format: 'float',
    },
    'Qwen embedding'
  );
  return parseEmbeddingResponse(payload, inputTexts.length);
}

async function rerankDocuments(query, documents) {
  if (!process.env.QWEN_RERANK_URL || documents.length < 2) return null;

  const payload = await postJson(
    process.env.QWEN_RERANK_URL,
    process.env.QWEN_RERANK_API_KEY || process.env.HF_TOKEN || '',
    {
      model: RERANK_MODEL,
      query,
      documents,
    },
    'Qwen reranker'
  );

  const results = payload?.results;
  if (
    !Array.isArray(results) ||
    results.some(
      (result) =>
        !result ||
        !Number.isInteger(result.index) ||
        result.index < 0 ||
        result.index >= documents.length ||
        !Number.isFinite(result.relevance_score)
    )
  ) {
    throw createProviderError('Qwen reranker returned an invalid result.', 502);
  }

  return [...results].sort(
    (left, right) => right.relevance_score - left.relevance_score
  );
}

module.exports = {
  DEFAULT_HF_EMBEDDING_URL,
  EMBEDDING_MODEL,
  RERANK_MODEL,
  embedTexts,
  parseEmbeddingResponse,
  parseHuggingFaceResponse,
  rerankDocuments,
};
