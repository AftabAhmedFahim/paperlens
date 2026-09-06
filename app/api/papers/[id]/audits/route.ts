import { NextResponse } from "next/server";
import { getCurrentFaculty } from "@/lib/auth";
import { getAuditsForPaper, saveAuditToDb } from "@/lib/db";
import { Audit } from "@/lib/types";

export const runtime = "nodejs";

const DEFAULT_FACULTY_ID = "fac-01";

export async function GET(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paperId } = await props.params;
    const audits = getAuditsForPaper(paperId);
    return NextResponse.json({ audits });
  } catch (err: any) {
    console.error("[GET /api/papers/[id]/audits]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to fetch audits." },
      { status: 500 }
    );
  }
}

export async function POST(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id: paperId } = await props.params;
    const faculty = await getCurrentFaculty();
    const body = await req.json();
    const facultyId = body.facultyId || faculty?.id || DEFAULT_FACULTY_ID;
    const audit: Audit = body.audit || body;
    const healthScore: number =
      typeof body.healthScore === "number" ? body.healthScore : audit.healthScore ?? 0;

    const { id: auditId } = saveAuditToDb(paperId, facultyId, healthScore, audit);
    return NextResponse.json({ id: auditId, success: true }, { status: 201 });
  } catch (err: any) {
    console.error("[POST /api/papers/[id]/audits]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to save audit." },
      { status: 500 }
    );
  }
}
