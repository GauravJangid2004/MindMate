const DEFAULT_OLLAMA_EMBEDDING_URL = 'http://127.0.0.1:11434/api/embed';
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

async function postJson(url, apiKey, body, serviceName) {
  let response;
  try {
    response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKey ? { Authorization: `Bearer ${apiKey}` } : {}),
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
    throw createProviderError(
      `${serviceName} endpoint returned HTTP ${response.status}.`,
      502
    );
  }

  try {
    return await response.json();
  } catch {
    throw createProviderError(`${serviceName} endpoint returned invalid JSON.`, 502);
  }
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

  const url = process.env.QWEN_EMBEDDING_URL || DEFAULT_OLLAMA_EMBEDDING_URL;
  let isOllamaEndpoint;
  try {
    isOllamaEndpoint =
      new URL(url).pathname.replace(/\/+$/, '') === '/api/embed';
  } catch {
    throw createProviderError('QWEN_EMBEDDING_URL must be a valid URL.', 503);
  }
  const payload = await postJson(
    url,
    isOllamaEndpoint ? '' : process.env.QWEN_EMBEDDING_API_KEY,
    isOllamaEndpoint
      ? { model: EMBEDDING_MODEL, input: inputTexts, truncate: true, keep_alive: -1 }
      : {
          model: EMBEDDING_MODEL,
          input: inputTexts,
          encoding_format: 'float',
        },
    'Qwen embedding'
  );

  if (isOllamaEndpoint) {
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

  return parseEmbeddingResponse(payload, inputTexts.length);
}

async function rerankDocuments(query, documents) {
  if (!process.env.QWEN_RERANK_URL || documents.length < 2) return null;

  const payload = await postJson(
    process.env.QWEN_RERANK_URL,
    process.env.QWEN_RERANK_API_KEY,
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
  EMBEDDING_MODEL,
  RERANK_MODEL,
  embedTexts,
  parseEmbeddingResponse,
  rerankDocuments,
};
