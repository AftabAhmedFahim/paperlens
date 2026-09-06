import { NextResponse } from "next/server";
import { deleteAuditFromDb } from "@/lib/db";

export const runtime = "nodejs";

export async function DELETE(
  _req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const deleted = deleteAuditFromDb(id);
    if (!deleted) {
      return NextResponse.json({ error: "Audit not found." }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[DELETE /api/audits/[id]]", err);
    return NextResponse.json(
      { error: err?.message || "Failed to delete audit." },
      { status: 500 }
    );
  }
}
