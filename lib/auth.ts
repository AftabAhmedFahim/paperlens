import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import facultyData from "@/data/faculty.json";

export const COOKIE_NAME = "paperlens_session";

function getSecretKey(): Uint8Array {
  const secret =
    process.env.AUTH_SECRET || "paperlens_super_secret_jwt_key_2026_aust_carnival";
  return new TextEncoder().encode(secret);
}

export interface FacultyUser {
  id: string;
  name: string;
  email: string;
  department: string;
  courses: string[];
}

export interface SessionPayload {
  sub: string;
  iat?: number;
  exp?: number;
}

/** Signs a JWT session token for a given facultyId with 8-hour expiry */
export async function signSession(facultyId: string): Promise<string> {
  return await new SignJWT({ sub: facultyId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(getSecretKey());
}

/** Verifies a JWT session token using HS256 and AUTH_SECRET */
export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecretKey(), {
      algorithms: ["HS256"],
    });
    return payload as SessionPayload;
  } catch {
    return null;
  }
}

/** Reads the session cookie in a server component or route handler and returns the FacultyUser */
export async function getCurrentFaculty(): Promise<FacultyUser | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE_NAME)?.value;
    if (!token) return null;

    const payload = await verifySession(token);
    if (!payload?.sub) return null;

    const faculty = (facultyData as any[]).find((f) => f.id === payload.sub);
    if (!faculty) return null;

    const { passwordHash, ...safeFaculty } = faculty;
    return safeFaculty as FacultyUser;
  } catch (err) {
    console.error("[getCurrentFaculty]", err);
    return null;
  }
}
