import pastQuestions from "@/data/past-questions.json";
import { generateJson } from "./gemini";
import { Audit, Paper, Question } from "./types";

/** ------------------------------------------------------------------
 *  Repeat detection, two stages.
 *  Stage 1 is pure TypeScript and always runs - no network, no API key.
 *  Stage 2 asks the model to judge only what stage 1 shortlisted.
 *  ------------------------------------------------------------------ */
const TOP_N = 5;
const MIN_COSINE = 0.25; // anything below this is not worth a model call
const FALLBACK_NEAR_DUPLICATE = 0.3;
const FALLBACK_RELATED = 0.22;

type BankEntry = { year: string; text: string };

export type Pair = {
  questionId: string;
  questionText: string;
  matchYear: string;
  matchText: string;
  similarity: number;
};

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

function termFrequency(tokens: string[]): Vec {
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

/**
 * STAGE 1 - TF-IDF over the past-question bank, cosine against every paper
 * question, top TOP_N candidates each, nothing below MIN_COSINE.
 */
export function shortlistPairs(
  questions: Question[],
  bank: BankEntry[] = pastQuestions as BankEntry[]
): Pair[] {
  if (!questions.length || !bank.length) return [];

  const corpus = [...questions.map((q) => q.text), ...bank.map((d) => d.text)];
  const tokenized = corpus.map(tokenize);

  const docFreq = new Map<string, number>();
  for (const toks of tokenized) {
    for (const t of new Set(toks)) docFreq.set(t, (docFreq.get(t) ?? 0) + 1);
  }
  const N = corpus.length;
  const idf = (t: string) => Math.log((N + 1) / ((docFreq.get(t) ?? 0) + 1)) + 1;

  const vectorize = (toks: string[]): Vec => {
    const v = termFrequency(toks);
    for (const [k, val] of v) v.set(k, val * idf(k));
    return v;
  };

  const qVecs = questions.map((_, i) => vectorize(tokenized[i]));
  const bankVecs = bank.map((_, i) => vectorize(tokenized[questions.length + i]));

  const pairs: Pair[] = [];
  questions.forEach((q, qi) => {
    bank
      .map((entry, di) => ({ entry, similarity: cosine(qVecs[qi], bankVecs[di]) }))
      .filter((c) => c.similarity >= MIN_COSINE)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, TOP_N)
      .forEach((c) => {
        pairs.push({
          questionId: q.id,
          questionText: q.text,
          matchYear: c.entry.year,
          matchText: c.entry.text,
          similarity: Math.round(c.similarity * 1000) / 1000,
        });
      });
  });
  return pairs;
}

/**
 * STAGE 2 - ONE model call judges every surviving pair. `similarity` on the
 * way out is always the stage-1 cosine, never a number the model invented.
 */
export async function judgePairs(pairs: Pair[]): Promise<Audit["repeats"]> {
  if (!pairs.length) return [];

  const prompt = `You are auditing a draft exam paper for questions repeated from past years.

For each candidate pair below, decide a verdict:
- "near-duplicate": a student who memorised the past answer could reproduce it with little change.
- "related": same topic, but the task, data or required reasoning genuinely differs.
- "distinct": not a meaningful repeat.

Judge the TASK, not shared vocabulary. Same topic with new data or a new sub-question is
"related", not "near-duplicate".

PAIRS:
${pairs
  .map(
    (p, i) =>
      `#${i} DRAFT ${p.questionId}: ${p.questionText}\n   PAST (${p.matchYear}): ${p.matchText}`
  )
  .join("\n")}

Return ONLY a raw JSON array with one entry per pair index. No markdown, no code fences:
[{"index":0,"verdict":"related","reason":"one sentence naming what is identical or what differs"}]`;

  let raw: unknown;
  try {
    raw = await generateJson(prompt);
  } catch (e) {
    console.error("[similarity/judge] falling back to raw cosine:", e);
    return cosineFallback(pairs);
  }

  const arr = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];
  if (!Array.isArray(arr) || !arr.length) {
    console.error("[similarity/judge] unusable model response, falling back to raw cosine");
    return cosineFallback(pairs);
  }

  const repeats: Audit["repeats"] = [];
  for (const r of arr) {
    const i = Number((r as any)?.index);
    const pair = pairs[i];
    if (!pair) continue;
    const verdict = String((r as any)?.verdict ?? "distinct");
    if (verdict !== "near-duplicate" && verdict !== "related") continue;
    repeats.push({
      questionId: pair.questionId,
      matchYear: pair.matchYear,
      matchText: pair.matchText,
      similarity: pair.similarity,
      verdict,
      reason: String((r as any)?.reason ?? "").slice(0, 300),
    });
  }
  return repeats.sort((a, b) => b.similarity - a.similarity);
}

/**
 * The model is optional. If the call fails or comes back unusable we still
 * report repeats from the stage-1 cosine alone, so a network hiccup degrades
 * the reasons rather than removing the feature.
 */
export function cosineFallback(pairs: Pair[]): Audit["repeats"] {
  return pairs
    .filter((p) => p.similarity > FALLBACK_RELATED)
    .map((p) => ({
      questionId: p.questionId,
      matchYear: p.matchYear,
      matchText: p.matchText,
      similarity: p.similarity,
      verdict:
        p.similarity > FALLBACK_NEAR_DUPLICATE
          ? ("near-duplicate" as const)
          : ("related" as const),
      reason: "high lexical overlap",
    }))
    .sort((a, b) => b.similarity - a.similarity);
}

/** Both stages. */
export async function detectRepeats(paper: Paper): Promise<Audit["repeats"]> {
  return judgePairs(shortlistPairs(paper.questions));
}
