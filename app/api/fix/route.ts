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
      replaceQuestionId?: string;
      issueMessage?: string;
    };
    const { paper, courseOutcomes: cos = [], targetCo, targetBloom, replaceQuestionId, issueMessage } = body;

    if (!paper?.questions) {
      return NextResponse.json(
        { error: "Send a draft question paper." },
        { status: 400 }
      );
    }

    if (!targetCo && !replaceQuestionId) {
      return NextResponse.json(
        { error: "Specify a targetCo or a replaceQuestionId to write a question for." },
        { status: 400 }
      );
    }

    const question = DEMO_MODE
      ? demoQuestion(paper, targetCo, replaceQuestionId)
      : await generateQuestion(paper, cos, targetCo, targetBloom ?? "Apply", replaceQuestionId, issueMessage);

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

/** Offline demo path - handles CO6 gap as well as repeat replacements and skew fixes */
function demoQuestion(paper: Paper, targetCo?: string, replaceQuestionId?: string): Question {
  // 1. If replacing a flagged repeat question from sample paper
  if (replaceQuestionId === "1a") {
    return {
      id: "1a",
      text: "Explain the foundational principles of E.F. Codd's relational data model. Using a university Enrollment schema as an example, contrast a relation schema with a relation instance, and demonstrate how entity integrity and referential integrity constraints prevent semantic anomalies.",
      marks: 8,
    };
  }

  if (replaceQuestionId === "1b") {
    return {
      id: "1b",
      text: "Consider an Enterprise database with Employee(emp_id, name, dept_id, salary) and Department(dept_id, dept_name). Explain how foreign keys preserve referential integrity. Detail what happens to associated Employee tuples under RESTRICT, CASCADE, and SET NULL when a Department record is deleted.",
      marks: 9,
    };
  }

  if (replaceQuestionId === "4a") {
    return {
      id: "4a",
      text: "Analyze how a database recovery manager coordinates write-ahead logging (WAL) and checkpointing to enforce both Atomicity and Durability during unexpected crash scenarios. Provide a step-by-step trace of recovery actions for an interrupted banking funds transfer.",
      marks: 10,
    };
  }

  if (replaceQuestionId === "2a") {
    return {
      id: "2a",
      text: "A logistics company manages fleet deliveries. A vehicle has a registration number, model, and capacity. A driver has a license number, name, and contact. A delivery job has a tracking code, destination, and scheduled time. A vehicle is assigned to one or more delivery jobs, and each job is assigned to exactly one driver and vehicle. Draw a complete ER diagram showing entity sets, relationship sets, primary keys, and cardinality constraints.",
      marks: 7,
    };
  }

  if (replaceQuestionId === "3a") {
    return {
      id: "3a",
      text: "Consider the schema: Hospital(hosp_id, hname, city), Doctor(doc_id, dname, specialization, hosp_id), Patient(pat_id, pname, disease, doc_id).\n(i) Write a relational algebra expression to find all doctors specialized in 'Cardiology' located in 'Chittagong'.\n(ii) Write an SQL query to list each hospital name along with the total count of distinct patients admitted.\n(iii) Write an SQL query to find doctors who currently have zero patients assigned.",
      marks: 7,
    };
  }

  if (replaceQuestionId === "3b") {
    return {
      id: "3b",
      text: "Given a University Research database with relation Project(grant_id, title, pi_id, pi_name, sponsor, allocated_budget) and functional dependencies grant_id -> title, pi_id, sponsor; pi_id -> pi_name. Determine all candidate keys, identify any partial or transitive dependencies, and decompose the schema into Boyce-Codd Normal Form (BCNF) while preserving dependencies.",
      marks: 7,
    };
  }

  // 2. Default CO6 missing outcome fix (preserves the verified 65 -> 82 demo flow)
  if (targetCo === "CO6" || !targetCo) {
    return { ...demoFix.question, id: freshId(paper, demoFix.question.id) };
  }

  // 3. Fallback for other COs
  const preferredId = freshId(paper, `Q_${targetCo}`);
  return {
    id: preferredId,
    text: `Demonstrate your practical understanding of ${targetCo} with reference to relational database architecture. Formulate a detailed solution addressing concurrency control, storage structures, and query execution efficiency.`,
    marks: 8,
  };
}

async function generateQuestion(
  paper: Paper,
  cos: CourseOutcome[],
  targetCo?: string,
  targetBloom?: Bloom,
  replaceQuestionId?: string,
  issueMessage?: string
): Promise<Question> {
  const existingQ = replaceQuestionId
    ? paper.questions.find((q) => q.id === replaceQuestionId)
    : undefined;
  const marks = existingQ?.marks || 8;
  const co = cos.find((c) => c.id === targetCo);

  const prompt = replaceQuestionId
    ? `You are helping a university examiner repair a draft exam question paper.

COURSE: ${paper.course}

Question ${replaceQuestionId} on the paper needs replacement because:
${issueMessage || "It duplicates or resembles a question from a previous year's exam paper."}

Original Question (${marks} marks):
"${existingQ?.text || ""}"

Target Course Outcome:
${targetCo || "General"}: ${co?.text || ""}

Cognitive Level: ${targetBloom || "Apply"}

Write ONE new, completely original exam question worth ${marks} marks that tests the same general topic/outcome without repeating or closely resembling the past-year question.
Match the academic style, rigor, and schema-driven context of university examinations.

Return ONLY raw JSON, no markdown, no code fences:
{"text":"the full replacement question text","marks":${marks}}`
    : `You are helping a university examiner repair a draft question paper.

COURSE: ${paper.course}

The outcome that needs assessing:
${targetCo}: ${co?.text ?? targetCo}

Write ONE new exam question that assesses ${targetCo} at the "${targetBloom || "Apply"}" level of Bloom's
taxonomy. It must be worth about ${marks} marks.

These questions are ALREADY on the paper. Your question must not duplicate any of them, and
must not simply restate the same task with different nouns:
${paper.questions.map((q) => `- ${q.text}`).join("\n")}

Requirements:
- Match the style and difficulty of the existing questions on this paper.
- Embed a small schema, relation or scenario the way the existing questions do.
- "${targetBloom || "Apply"}" must be the cognitive demand.

Return ONLY raw JSON, no markdown, no code fences:
{"text":"the full question text","marks":${marks}}`;

  const raw = (await generateJson(prompt)) as any;
  const text = String(raw?.text ?? "").trim();
  if (!text) throw new Error("the model returned no question text");

  const rawMarks = Number(raw?.marks);
  const finalMarks = Number.isFinite(rawMarks) && rawMarks > 0 ? Math.round(rawMarks) : marks;

  return {
    id: replaceQuestionId || freshId(paper, "F1"),
    text,
    marks: finalMarks,
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
