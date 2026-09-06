import { NextResponse } from "next/server";
import demoFix from "@/data/demo-cache/fix.json";
import { DEMO_MODE } from "@/lib/demo";
import { generateJson } from "@/lib/gemini";
import { BLOOM_LEVELS, Bloom, CourseOutcome, Paper, Question } from "@/lib/types";

export const runtime = "nodejs";
export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      paper?: Paper;
      courseOutcomes?: CourseOutcome[];
      targetCo?: string;
      targetBloom?: Bloom;
    };
    const { paper, courseOutcomes: cos = [], targetCo, targetBloom } = body;

    if (!paper?.questions || !targetCo) {
      return NextResponse.json(
        { error: "Send a paper, the course outcomes and the targetCo to write a question for." },
        { status: 400 }
      );
    }

    const question = DEMO_MODE
      ? demoQuestion(paper)
      : await generateQuestion(paper, cos, targetCo, targetBloom ?? "Apply");

    return NextResponse.json(question);
  } catch (err) {
    console.error("[fix]", err);
    return NextResponse.json(
      {
        error:
          err instanceof Error
            ? `Could not generate a replacement question: ${err.message}`
            : "Could not generate a replacement question.",
      },
      { status: 200 }
    );
  }
}

/** Offline demo path - the pre-written CO6 question from /data/demo-cache. */
function demoQuestion(paper: Paper): Question {
  return { ...demoFix.question, id: freshId(paper, demoFix.question.id) };
}

async function generateQuestion(
  paper: Paper,
  cos: CourseOutcome[],
  targetCo: string,
  targetBloom: Bloom
): Promise<Question> {
  const co = cos.find((c) => c.id === targetCo);
  const avgMarks = Math.round(
    paper.questions.reduce((s, q) => s + q.marks, 0) / Math.max(paper.questions.length, 1)
  );

  const prompt = `You are helping a university examiner repair a draft question paper.

COURSE: ${paper.course}

The outcome that needs assessing:
${targetCo}: ${co?.text ?? targetCo}

Write ONE new exam question that assesses ${targetCo} at the "${targetBloom}" level of Bloom's
taxonomy. It must be worth about ${avgMarks || 8} marks.

These questions are ALREADY on the paper. Your question must not duplicate any of them, and
must not simply restate the same task with different nouns:
${paper.questions.map((q) => `- ${q.text}`).join("\n")}

Requirements:
- Match the style and difficulty of the existing questions on this paper.
- Embed a small schema, relation or scenario the way the existing questions do.
- "${targetBloom}" must be the cognitive demand: at Evaluate the student must compare options
  and defend a choice, not merely carry out a taught procedure.

Return ONLY raw JSON, no markdown, no code fences:
{"text":"the full question text","marks":${avgMarks || 8}}`;

  const raw = (await generateJson(prompt)) as any;
  const text = String(raw?.text ?? "").trim();
  if (!text) throw new Error("the model returned no question text");

  const marks = Number(raw?.marks);
  return {
    id: freshId(paper, "F1"),
    text,
    marks: Number.isFinite(marks) && marks > 0 ? Math.round(marks) : avgMarks || 8,
  };
}

/** Never collide with an id already on the paper - the loop can be run twice. */
function freshId(paper: Paper, preferred: string): string {
  const taken = new Set(paper.questions.map((q) => q.id));
  if (!taken.has(preferred)) return preferred;
  for (let n = 2; n < 100; n++) {
    const candidate = `${preferred}${n}`;
    if (!taken.has(candidate)) return candidate;
  }
  return `${preferred}-${Date.now()}`;
}
