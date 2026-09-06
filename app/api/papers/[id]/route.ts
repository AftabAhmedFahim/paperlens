import { NextResponse } from "next/server";
import { getPaper, getOutcomes, updatePaperInDb, deletePaperFromDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const paper = getPaper(id);
    if (!paper) {
      return NextResponse.json({ error: "Paper not found." }, { status: 404 });
    }

    const outcomes = getOutcomes(id);
    return NextResponse.json({
      id: paper.id,
      title: paper.title,
      faculty_id: paper.faculty_id,
      paper: {
        course: paper.course,
        totalMarks: paper.totalMarks,
        questions: paper.questions,
      },
      courseOutcomes: outcomes,
    });
  } catch (err: any) {
    console.error("[GET /api/papers/[id]]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch paper." },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const body = await req.json();

    const updated = updatePaperInDb(id, {
      course: body.course,
      title: body.title,
      questions: body.questions || (body.paper?.questions),
    });

    if (!updated) {
      return NextResponse.json({ error: "Failed to update paper." }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[PATCH /api/papers/[id]]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to update paper." },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const deleted = deletePaperFromDb(id);
    if (!deleted) {
      return NextResponse.json({ error: "Paper not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/papers/[id]]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete paper." },
      { status: 500 }
    );
  }
}
