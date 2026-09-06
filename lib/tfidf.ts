// Plain-TypeScript TF-IDF + cosine similarity. No embeddings, no vector DB.

const STOP = new Set(
  ("a an the and or of for to in on with what which is are be as by from that this " +
    "explain describe write state list give show define discuss draw using use each " +
    "following question marks all any it its their your you we they how why when do does").split(
    " "
  )
);

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOP.has(t));
}

type Vec = Map<string, number>;

function tf(tokens: string[]): Vec {
  const m: Vec = new Map();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  for (const [k, v] of m) m.set(k, v / tokens.length);
  return m;
}

function cosine(a: Vec, b: Vec): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (const v of a.values()) na += v * v;
  for (const [k, v] of b) {
    nb += v * v;
    const av = a.get(k);
    if (av) dot += av * v;
  }
  if (na === 0 || nb === 0) return 0;
  return dot / (Math.sqrt(na) * Math.sqrt(nb));
}

export type Candidate<T> = { doc: T; similarity: number };

/** Shortlist the top-N most similar documents for each query, by TF-IDF cosine. */
export function shortlist<Q extends { text: string }, D extends { text: string }>(
  queries: Q[],
  docs: D[],
  topN = 5
): Map<Q, Candidate<D>[]> {
  const corpus = [...queries.map((q) => q.text), ...docs.map((d) => d.text)];
  const tokenized = corpus.map(tokenize);

  const df = new Map<string, number>();
  for (const toks of tokenized) {
    for (const t of new Set(toks)) df.set(t, (df.get(t) ?? 0) + 1);
  }
  const N = corpus.length;
  const idf = (t: string) => Math.log((N + 1) / ((df.get(t) ?? 0) + 1)) + 1;

  const vectorize = (toks: string[]): Vec => {
    const v = tf(toks);
    for (const [k, val] of v) v.set(k, val * idf(k));
    return v;
  };

  const qVecs = queries.map((_, i) => vectorize(tokenized[i]));
  const dVecs = docs.map((_, i) => vectorize(tokenized[queries.length + i]));

  const out = new Map<Q, Candidate<D>[]>();
  queries.forEach((q, qi) => {
    const scored = docs
      .map((doc, di) => ({ doc, similarity: cosine(qVecs[qi], dVecs[di]) }))
      .filter((c) => c.similarity > 0.02)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, topN);
    out.set(q, scored);
  });
  return out;
}
