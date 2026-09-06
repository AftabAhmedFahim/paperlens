import { NextResponse } from "next/server";
import pastQuestions from "@/data/past-questions.json";
import { buildAudit } from "@/lib/audit";
import { generateJson } from "@/lib/gemini";
import { shortlist } from "@/lib/tfidf";
import {
  Audit,
  Bloom,
  BLOOM_LEVELS,
  CourseOutcome,
  Paper,
  PastQuestion,
  emptyAudit,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      paper?: Paper;
      courseOutcomes?: CourseOutcome[];
    };
    const paper = body.paper;
    const cos = body.courseOutcomes ?? [];

    if (!paper?.questions?.length || !cos.length) {
      return NextResponse.json(
        { error: "Send a paper with at least one question and at least one course outcome." },
        { status: 400 }
      );
    }

    return NextResponse.json(await analyze(paper, cos));
  } catch (err) {
    console.error("[analyze]", err);
    const audit = emptyAudit();
    if (err instanceof Error) {
      audit.issues[0].message = `The audit could not be completed: ${err.message}`;
    }
    return NextResponse.json(audit, { status: 200 });
  }
}

async function analyze(paper: Paper, cos: CourseOutcome[]): Promise<Audit> {
  const classification = await classify(paper, cos);
  const repeats = await detectRepeats(paper);
  return buildAudit(paper, cos, classification, repeats);
}

/** ONE batched call classifies every question. Never one call per question. */
async function classify(paper: Paper, cos: CourseOutcome[]) {
  const prompt = `You are an examination auditor for a university engineering programme.
You are EVALUATING an existing question paper. You are not writing questions.

COURSE: ${paper.course}

COURSE OUTCOMES:
${cos.map((c) => `${c.id} [target level: ${c.targetBloom}]: ${c.text}`).join("\n")}

QUESTIONS:
${paper.questions.map((q) => `${q.id} (${q.marks} marks): ${q.text}`).join("\n")}

For EVERY question above, decide:
1. "co": the single course outcome id it primarily assesses. Exactly one of: ${cos
    .map((c) => c.id)
    .join(", ")}. If it genuinely maps to none, use "NONE".
2. "bloom": the highest Bloom level the question actually demands. Exactly one of: ${BLOOM_LEVELS.join(
    ", "
  )}.
3. "rationale": one short sentence (max 20 words) naming the verb or task that fixes the level.

Bloom guidance - judge the cognitive demand, not the topic:
- Remember: define, list, state, name a fact.
- Understand: explain, describe, differentiate a known concept.
- Apply: solve, compute, draw a standard diagram, write SQL, normalise a relation by a taught procedure.
- Analyze: decompose, compare trade-offs, diagnose why something fails, derive from given data.
- Evaluate: judge, justify a choice, critique, argue which option is better.
- Create: design something novel, propose an original scheme.
A routine textbook procedure is Apply, not Analyze, even when it looks hard.

Return ONLY a raw JSON array. No markdown, no code fences, no commentary:
[{"id":"Q1","co":"CO1","bloom":"Remember","rationale":"..."}]`;

  let raw: unknown;
  try {
    raw = await generateJson(prompt);
  } catch (e) {
    console.error("[analyze/classify]", e);
    return [];
  }

  const arr = Array.isArray(raw) ? raw : (raw as any)?.questions ?? [];
  if (!Array.isArray(arr)) return [];

  const coIds = new Set(cos.map((c) => c.id));
  return arr
    .map((r: any) => ({
      id: String(r?.id ?? ""),
      co: coIds.has(String(r?.co)) ? String(r.co) : "NONE",
      bloom: (BLOOM_LEVELS.includes(r?.bloom) ? r.bloom : "Understand") as Bloom,
      rationale: String(r?.rationale ?? "").slice(0, 200),
    }))
    .filter((r) => r.id);
}

/** TF-IDF shortlists candidates; ONE model call judges only the shortlisted pairs. */
async function detectRepeats(paper: Paper): Promise<Audit["repeats"]> {
  const bank = pastQuestions as PastQuestion[];
  const lists = shortlist(paper.questions, bank, 5);

  const pairs: {
    questionId: string;
    questionText: string;
    matchYear: string;
    matchText: string;
    similarity: number;
  }[] = [];

  for (const q of paper.questions) {
    for (const c of lists.get(q) ?? []) {
      pairs.push({
        questionId: q.id,
        questionText: q.text,
        matchYear: c.doc.year,
        matchText: c.doc.text,
        similarity: c.similarity,
      });
    }
  }
  if (!pairs.length) return [];

  const prompt = `You are auditing a draft exam paper for questions repeated from past years.

For each candidate pair below decide a verdict:
- "near-duplicate": a student who memorised the past answer could reproduce it with little change.
- "related": same topic, but the task, data or required reasoning genuinely differs.
- "distinct": not a meaningful repeat.

Judge the TASK, not shared vocabulary. Same topic with new data or a new sub-question is "related", not "near-duplicate".

PAIRS:
${pairs
  .map(
    (p, i) =>
      `#${i} DRAFT ${p.questionId}: ${p.questionText}\n   PAST (${p.matchYear}): ${p.matchText}`
  )
  .join("\n")}

Return ONLY a raw JSON array, one entry per pair index. No markdown, no code fences:
[{"index":0,"verdict":"related","reason":"one short sentence naming what is identical or what differs"}]`;

  let raw: unknown;
  try {
    raw = await generateJson(prompt);
  } catch (e) {
    console.error("[analyze/repeats]", e);
    return [];
  }

  const arr = Array.isArray(raw) ? raw : (raw as any)?.results ?? [];
  if (!Array.isArray(arr)) return [];

  const verdicts = new Map<number, { verdict: string; reason: string }>();
  for (const r of arr) {
    const i = Number((r as any)?.index);
    if (Number.isInteger(i)) {
      verdicts.set(i, {
        verdict: String((r as any)?.verdict ?? "distinct"),
        reason: String((r as any)?.reason ?? "").slice(0, 300),
      });
    }
  }

  // Keep only the strongest flagged match per draft question.
  const best = new Map<string, Audit["repeats"][number]>();
  pairs.forEach((p, i) => {
    const v = verdicts.get(i);
    if (!v || (v.verdict !== "near-duplicate" && v.verdict !== "related")) return;
    const entry = {
      questionId: p.questionId,
      matchYear: p.matchYear,
      matchText: p.matchText,
      similarity: Math.round(p.similarity * 1000) / 1000,
      verdict: v.verdict as "near-duplicate" | "related",
      reason: v.reason,
    };
    const weight = (e: typeof entry) =>
      (e.verdict === "near-duplicate" ? 10 : 0) + e.similarity;
    const prev = best.get(p.questionId);
    if (!prev || weight(entry) > weight(prev as typeof entry)) best.set(p.questionId, entry);
  });

  return [...best.values()].sort((a, b) => b.similarity - a.similarity);
}
