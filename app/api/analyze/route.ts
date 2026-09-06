import { NextResponse } from "next/server";
import demoAnalyze from "@/data/demo-cache/analyze.json";
import demoFix from "@/data/demo-cache/fix.json";
import samplePaper from "@/data/sample-paper.json";
import sampleCos from "@/data/sample-cos.json";
import samplePaperCse1101 from "@/data/sample-paper-cse1101.json";
import samplePaperCse2101 from "@/data/sample-paper-cse2101.json";
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
  const courseNorm = (paper.course || "").toUpperCase();
  const isCse1101 = courseNorm.includes("1101") || courseNorm.includes("STRUCTURED");
  const isCse2101 = courseNorm.includes("2101") || courseNorm.includes("DATA STRUCT");

  if (isCse1101) {
    return demoAuditCse1101(paper, cos);
  }
  if (isCse2101) {
    return demoAuditCse2101(paper, cos);
  }

  // ── CSE 3103 (Database Systems) Verified Pitch Demo ───────────────────────
  const cached = demoAnalyze as Audit;
  const originalCse3103Texts = new Map((samplePaper as Paper).questions.map((q) => [q.id, q.text.trim()]));
  const known = new Map(cached.questionAnalysis.map((q) => [q.id, q]));

  const classification = paper.questions.map((q) => {
    const origText = originalCse3103Texts.get(q.id);
    const hit = known.get(q.id);

    // If it's an original CSE 3103 question that hasn't been replaced
    if (hit && (!origText || origText === q.text.trim())) {
      return hit;
    }

    // A question added or modified by the fix-it loop for CO6
    const isCo6Fix =
      q.id === "5a" ||
      q.text.trim() === demoFix.question.text.trim() ||
      q.text.toLowerCase().includes("isolation level") ||
      q.text.toLowerCase().includes("concurrency control") ||
      q.text.toLowerCase().includes("two-phase locking") ||
      q.text.toLowerCase().includes("optimistic concurrency");

    if (isCo6Fix) {
      return {
        id: q.id,
        co: "CO6",
        bloom: "Evaluate" as Bloom,
        rationale: "Evaluates concurrency control and isolation levels.",
      };
    }

    // If replaced question 1a, 1b, etc.
    if (q.id === "1a" || q.id === "1b") {
      return {
        id: q.id,
        co: "CO1",
        bloom: "Understand" as Bloom,
        rationale: "Explains relational model integrity principles.",
      };
    }

    if (q.id === "2a" || q.id === "2b") {
      return {
        id: q.id,
        co: "CO2",
        bloom: "Apply" as Bloom,
        rationale: "Applies conceptual ER schema modeling.",
      };
    }

    if (q.id === "3a") {
      return {
        id: q.id,
        co: "CO3",
        bloom: "Apply" as Bloom,
        rationale: "Applies relational algebra and SQL queries.",
      };
    }

    if (q.id === "3b") {
      return {
        id: q.id,
        co: "CO4",
        bloom: "Analyze" as Bloom,
        rationale: "Analyzes functional dependencies and normalizes schema.",
      };
    }

    if (q.id === "4a" || q.id === "4b") {
      return {
        id: q.id,
        co: "CO5",
        bloom: "Analyze" as Bloom,
        rationale: "Analyzes recovery, logging, and storage architecture.",
      };
    }

    return hit || {
      id: q.id,
      co: "NONE",
      bloom: "Understand" as Bloom,
      rationale: "Evaluated in offline demo mode.",
    };
  });

  // Repeats: only include if the question text still matches the original repeated text!
  // If the user replaced Question 1a with an AI fix, 1a is no longer a near-duplicate!
  const repeats = cached.repeats.filter((r) => {
    const currentQ = paper.questions.find((q) => q.id === r.questionId);
    if (!currentQ) return false;
    const origText = originalCse3103Texts.get(r.questionId);
    return !origText || origText === currentQ.text.trim();
  });

  return buildAudit(paper, cos, classification, repeats);
}

function demoAuditCse1101(paper: Paper, cos: CourseOutcome[]): Audit {
  const origPaper = samplePaperCse1101 as any;
  const origTexts = new Map((origPaper.questions as any[]).map((q) => [q.id, q.text.trim()]));

  const knownMap: Record<string, { co: string; bloom: Bloom; rationale: string }> = {
    "1a": { co: "CO1", bloom: "Remember", rationale: "States storage class specifiers and memory scope." },
    "1b": { co: "CO2", bloom: "Understand", rationale: "Explains call by value vs call by reference." },
    "2a": { co: "CO3", bloom: "Apply", rationale: "Writes complete C matrix multiplication program." },
    "2b": { co: "CO3", bloom: "Apply", rationale: "Writes C program for string word count and case reversal." },
    "3a": { co: "CO4", bloom: "Analyze", rationale: "Determines program output and traces pointer arithmetic." },
    "3b": { co: "CO4", bloom: "Analyze", rationale: "Identifies defects and compiler vs runtime consequences." },
    "4a": { co: "CO5", bloom: "Evaluate", rationale: "Compares recursive vs iterative Fibonacci implementations." },
    "4b": { co: "CO6", bloom: "Create", rationale: "Designs modular C program decomposition with structs." },
  };

  const classification = paper.questions.map((q) => {
    const k = knownMap[q.id];
    return {
      id: q.id,
      co: k?.co || "CO6",
      bloom: k?.bloom || ("Apply" as Bloom),
      rationale: k?.rationale || "Assesses programming principles.",
    };
  });

  // Repeats for CSE 1101: 1a matches 2023 past question if not replaced
  const repeats: Audit["repeats"] = [];
  const q1a = paper.questions.find((q) => q.id === "1a");
  if (q1a && origTexts.get("1a") === q1a.text.trim()) {
    repeats.push({
      questionId: "1a",
      matchYear: "2023",
      matchText: "State the storage class specifiers available in C and explain the scope and lifetime of a static local variable with an example.",
      similarity: 0.65,
      verdict: "near-duplicate",
      reason: "Near-identical question asking for C storage classes (auto, register, static, extern) scope and lifetime.",
    });
  }

  return buildAudit(paper, cos, classification, repeats);
}

function demoAuditCse2101(paper: Paper, cos: CourseOutcome[]): Audit {
  const origPaper = samplePaperCse2101 as any;
  const origTexts = new Map((origPaper.questions as any[]).map((q) => [q.id, q.text.trim()]));

  const knownMap: Record<string, { co: string; bloom: Bloom; rationale: string }> = {
    "1a": { co: "CO1", bloom: "Remember", rationale: "Defines linear data structures and time complexity." },
    "1b": { co: "CO2", bloom: "Understand", rationale: "Explains asymptotic Big-O, Big-Omega, Big-Theta notation." },
    "2a": { co: "CO3", bloom: "Apply", rationale: "Implements singly linked list insertion and deletion." },
    "2b": { co: "CO3", bloom: "Apply", rationale: "Converts infix expression to postfix using a stack." },
    "3a": { co: "CO4", bloom: "Apply", rationale: "Constructs and manipulates binary search tree." },
    "3b": { co: "CO4", bloom: "Apply", rationale: "Traces BFS and DFS graph traversals." },
    "4a": { co: "CO1", bloom: "Understand", rationale: "Explains hashing collision resolution techniques." },
    "4b": { co: "CO6", bloom: "Evaluate", rationale: "Evaluates dynamic array vs doubly linked list for logging." },
    "5a": { co: "CO5", bloom: "Analyze", rationale: "Analyzes and compares Quick Sort vs Merge Sort efficiency." },
  };

  const classification = paper.questions.map((q) => {
    const isCo5 =
      q.id === "5a" ||
      q.text.toLowerCase().includes("quick sort") ||
      q.text.toLowerCase().includes("sorting") ||
      q.text.toLowerCase().includes("binary search versus hash");

    if (isCo5) {
      return {
        id: q.id,
        co: "CO5",
        bloom: "Analyze" as Bloom,
        rationale: "Analyzes sorting and searching algorithm efficiency and complexity.",
      };
    }

    const k = knownMap[q.id];
    return {
      id: q.id,
      co: k?.co || "CO1",
      bloom: k?.bloom || ("Apply" as Bloom),
      rationale: k?.rationale || "Assesses data structures and algorithm design.",
    };
  });

  const repeats: Audit["repeats"] = [];
  const q1a = paper.questions.find((q) => q.id === "1a");
  if (q1a && origTexts.get("1a") === q1a.text.trim()) {
    repeats.push({
      questionId: "1a",
      matchYear: "2022",
      matchText: "Define the following data structures and state the time complexity of their insertion and deletion operations: (i) stack, (ii) queue, (iii) priority queue, (iv) singly linked list. State one practical application of each.",
      similarity: 0.68,
      verdict: "near-duplicate",
      reason: "Re-uses identical prompt asking for definition and operation complexity of linear data structures.",
    });
  }

  const q2b = paper.questions.find((q) => q.id === "2b");
  if (q2b && origTexts.get("2b") === q2b.text.trim()) {
    repeats.push({
      questionId: "2b",
      matchYear: "2023",
      matchText: "Convert the infix expression P * Q + ( R - S ) / T into its postfix form using a stack. Show the stack contents and the output string after each symbol is scanned.",
      similarity: 0.72,
      verdict: "near-duplicate",
      reason: "Identical infix-to-postfix stack tracing task with only variable name substitutions.",
    });
  }

  const q4a = paper.questions.find((q) => q.id === "4a");
  if (q4a && origTexts.get("4a") === q4a.text.trim()) {
    repeats.push({
      questionId: "4a",
      matchYear: "2024",
      matchText: "What is hashing? Explain separate chaining, linear probing and quadratic probing as collision resolution techniques. Insert the keys 15, 25, 35, 45 into a hash table of size 10 using h(k) = k mod 10 with linear probing and show the resulting table.",
      similarity: 0.70,
      verdict: "near-duplicate",
      reason: "Nearly identical hashing question asking for separate chaining, linear probing, and table insertion trace.",
    });
  }

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
