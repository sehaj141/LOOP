// Vector Embedding and Semantic Search Engine for RAG Grounded Q&A

const VECTOR_DIM = 64;

// Vocabulary features for lightweight dense embedding projection
const FEATURE_VOCAB = [
  "onboarding", "signup", "invite", "login", "auth", "password", "sso", "security",
  "billing", "invoice", "payment", "pricing", "checkout", "subscription", "plan",
  "dashboard", "analytics", "chart", "report", "export", "csv", "data", "speed",
  "bug", "crash", "error", "slow", "timeout", "broken", "mobile", "app", "ios",
  "android", "ui", "ux", "design", "layout", "font", "navigation", "search", "filter",
  "support", "chat", "help", "ticket", "response", "feature", "request", "integration",
  "api", "webhook", "notification", "email", "performance", "latency", "loading",
  "gorgeous", "love", "awesome", "terrible", "hate", "frustrating", "confusing", "fast"
];

export function generateEmbedding(text: string): number[] {
  const normalized = text.toLowerCase();
  const tokens = normalized.match(/\w+/g) || [];
  const tokenSet = new Set(tokens);
  
  const vector = new Array(VECTOR_DIM).fill(0);

  // 1. Direct vocabulary matching (indices 0..VECTOR_DIM-1)
  FEATURE_VOCAB.slice(0, VECTOR_DIM).forEach((feature, idx) => {
    if (tokenSet.has(feature) || normalized.includes(feature)) {
      vector[idx] += 1.0;
    }
  });

  // 2. Hash fallback for out-of-vocabulary terms to distribute signal
  tokens.forEach((token) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % VECTOR_DIM;
    vector[idx] += 0.2;
  });

  // 3. Normalize vector (L2 norm)
  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < VECTOR_DIM; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(4));
    }
  }

  return vector;
}

export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export interface SemanticSearchResult<T> {
  item: T;
  score: number;
}

export function searchFeedbackSemantics<T extends { id: string; content: string; embedding?: { vector: string } | null }>(
  query: string,
  items: T[],
  topK: number = 5
): SemanticSearchResult<T>[] {
  const queryVec = generateEmbedding(query);

  const scored = items.map((item) => {
    let itemVec: number[];
    if (item.embedding?.vector) {
      try {
        itemVec = JSON.parse(item.embedding.vector);
      } catch {
        itemVec = generateEmbedding(item.content);
      }
    } else {
      itemVec = generateEmbedding(item.content);
    }

    const similarity = cosineSimilarity(queryVec, itemVec);
    return { item, score: similarity };
  });

  // Sort descending by score
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, topK);
}
