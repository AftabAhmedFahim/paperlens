import { NextResponse } from "next/server";
import { getCurrentFaculty } from "@/lib/auth";

export async function GET() {
  const faculty = await getCurrentFaculty();
  if (!faculty) {
    return NextResponse.json({ faculty: null }, { status: 401 });
  }
  return NextResponse.json({ faculty });
}
