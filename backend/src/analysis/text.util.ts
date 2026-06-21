const STOPWORDS = new Set([
  'a', 'an', 'and', 'the', 'to', 'of', 'or', 'for', 'in', 'on', 'at', 'is',
  'are', 'be', 'it', 'its', 'as', 'by', 'with', 'you', 'your', 'they', 'them',
  'me', 'my', 'i', 'we', 'us', 'this', 'that', 'so', 'if', 'but', 'not', 'no',
  'do', 'did', 'has', 'have', 'was', 'were', 'will', 'would', 'can', 'just',
  'from', 'about', 'into', 'than', 'then', 'via', 'who', 'what', 'when', 'how',
]);

// Short tokens that still carry scam signal and should survive tokenizing.
const KEEP_SHORT = new Set([
  'zelle', 'cash', 'app', 'wire', 'gift', 'card', 'code', 'psa', 'bgs', 'cgc',
  'otp', '2fa', 'ff', 'paid', 'pay', 'fee', 'fees', 'cert', 'slab', 'box',
]);

/** Lowercase, crude singularize, drop noise. Deterministic. */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s&-]/g, ' ')
    .split(/\s+/)
    .map((w) => w.replace(/[-&]/g, ''))
    .filter(Boolean)
    .map(singularize)
    .filter((w) => (w.length >= 4 || KEEP_SHORT.has(w)) && !STOPWORDS.has(w));
}

function singularize(w: string): string {
  if (w.length > 4 && w.endsWith('ies')) return `${w.slice(0, -3)}y`;
  if (w.length > 4 && w.endsWith('es')) return w.slice(0, -2);
  if (w.length > 3 && w.endsWith('s')) return w.slice(0, -1);
  return w;
}

export function tokenSet(text: string): Set<string> {
  return new Set(tokenize(text));
}

/**
 * Does `phrase` meaningfully appear in `haystack`?
 * 1-2 keyword phrases require all keywords; longer phrases require >=2 and
 * at least half. Tuned so the UI's quick-signal chips reliably match the
 * knowledge base's red flags.
 */
export function phraseMatches(phrase: string, haystack: Set<string>): boolean {
  const keys = [...new Set(tokenize(phrase))];
  if (keys.length === 0) return false;
  const hits = keys.filter((k) => haystack.has(k)).length;
  if (keys.length <= 2) return hits === keys.length;
  return hits >= Math.max(2, Math.ceil(keys.length * 0.5));
}

/** Count of shared tokens — the retrieval relevance signal (pgvector later). */
export function overlapScore(query: Set<string>, doc: Set<string>): number {
  let n = 0;
  for (const t of query) if (doc.has(t)) n++;
  return n;
}
