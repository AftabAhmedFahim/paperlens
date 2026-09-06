import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { signSession, COOKIE_NAME } from "@/lib/auth";
import facultyData from "@/data/faculty.json";

// Pre-computed dummy hash to guarantee constant-time comparison even for invalid emails
const DUMMY_HASH = "$2b$10$ebMVMBeZy0SD0TaPZAiDvukn.9vhI9QaCip1SkcBqAm9tPyjwnI5e";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const email = String(body.email || "").trim().toLowerCase();
    const password = String(body.password || "");

    const faculty = (facultyData as any[]).find(
      (f) => String(f.email).toLowerCase() === email
    );

    // Constant-time comparison: always run bcrypt.compare
    const hashToCompare = faculty?.passwordHash || DUMMY_HASH;
    const isValid = await bcrypt.compare(password, hashToCompare);

    if (!faculty || !isValid) {
      return NextResponse.json(
        { error: "Invalid email or password." },
        { status: 401 }
      );
    }

    const token = await signSession(faculty.id);

    const { passwordHash, ...safeFaculty } = faculty;
    const response = NextResponse.json({ faculty: safeFaculty });

    const maxAge = 8 * 60 * 60; // 8 hours

    response.cookies.set({
      name: COOKIE_NAME,
      value: token,
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge,
      path: "/",
    });

    return response;
  } catch (err) {
    console.error("[api/auth/login]", err);
    return NextResponse.json(
      { error: "Authentication failed. Please try again." },
      { status: 500 }
    );
  }
}
