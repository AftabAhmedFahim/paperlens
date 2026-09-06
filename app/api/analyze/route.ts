import { NextResponse } from "next/server";
import demoAnalyze from "@/data/demo-cache/analyze.json";
import demoFix from "@/data/demo-cache/fix.json";
import samplePaper from "@/data/sample-paper.json";
import sampleCos from "@/data/sample-cos.json";
import { buildAudit } from "@/lib/audit";
import { DEMO_MODE } from "@/lib/demo";
import { generateJson } from "@/lib/gemini";
import { detectRepeats } from "@/lib/similarity";
import {
  Audit,
  Bloom,
  BLOOM_LEVELS,
  CourseOutcome,
  Paper,
  emptyAudit,
} from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 60;

/** Smoke test - GET /api/analyze runs the whole pipeline on the seeded sample. */
export async function GET() {
  const audit = await analyze(samplePaper as Paper, sampleCos as CourseOutcome[]);
  return NextResponse.json({
    _smokeTest: "seeded sample-paper.json + sample-cos.json",
    healthScore: audit.healthScore,
    bloom: audit.bloom,
    coverage: audit.coverage,
    repeats: audit.repeats,
    issues: audit.issues,
    questionAnalysis: audit.questionAnalysis,
  });
}

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
  if (DEMO_MODE) return demoAudit(paper, cos);
  const classification = await classify(paper, cos);
  const repeats = await detectRepeats(paper);
  return buildAudit(paper, cos, classification, repeats);
}

/**
 * Offline demo path. Serves the cached classification and repeat verdicts from
 * /data/demo-cache instead of calling Gemini, but still runs them through the
 * real buildAudit, so a question added by /api/fix moves the score exactly as
 * it would on the live path.
 */
function demoAudit(paper: Paper, cos: CourseOutcome[]): Audit {
  const cached = demoAnalyze as Audit;
  const known = new Map(cached.questionAnalysis.map((q) => [q.id, q]));

  const classification = paper.questions.map((q) => {
    const hit = known.get(q.id);
    if (hit) return hit;
    // A question appended by the fix-it loop.
    if (q.text.trim() === demoFix.question.text.trim()) {
      return { ...demoFix.classification, id: q.id, bloom: demoFix.classification.bloom as Bloom };
    }
    return {
      id: q.id,
      co: "NONE",
      bloom: "Understand" as Bloom,
      rationale: "Not present in the offline demo cache.",
    };
  });

  const ids = new Set(paper.questions.map((q) => q.id));
  const repeats = cached.repeats.filter((r) => ids.has(r.questionId));

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
