import { NextResponse } from "next/server";
import { getCurrentFaculty } from "@/lib/auth";
import { getPapersForFaculty, createPaperInDb } from "@/lib/db";
import { Paper, CourseOutcome } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_FACULTY_ID = "fac-01";

export async function GET() {
  try {
    const faculty = await getCurrentFaculty();
    const facultyId = faculty?.id || DEFAULT_FACULTY_ID;
    const papers = getPapersForFaculty(facultyId);
    return NextResponse.json({ papers });
  } catch (err: any) {
    console.error("[GET /api/papers]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch papers." },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const faculty = await getCurrentFaculty();
    const facultyId = faculty?.id || DEFAULT_FACULTY_ID;
    const body = await req.json();

    const paper: Paper = body.paper || {
      course: body.course || "CSE 3103",
      totalMarks: body.totalMarks || 60,
      questions: body.questions || [],
    };
    const outcomes: CourseOutcome[] = body.courseOutcomes || body.outcomes || [];
    const title: string = body.title || `${paper.course} — Examination Paper`;

    const { id } = createPaperInDb(facultyId, paper, outcomes, title);
    return NextResponse.json({ id, success: true }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/papers]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to create paper." },
      { status: 500 }
    );
  }
}
