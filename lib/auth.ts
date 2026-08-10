import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "loop_super_secret_jwt_key_2026_zidio_platform"
);

export interface UserSessionPayload {
  userId: string;
  name: string;
  email: string;
  role: "ADMIN" | "ANALYST" | "VIEWER";
  workspaceId: string;
  workspaceName: string;
}

export async function hashPassword(password: string): Promise<string> {
  return await bcrypt.hash(password, 10);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return await bcrypt.compare(password, hash);
}

export async function signJwtToken(payload: UserSessionPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(JWT_SECRET);
}

export async function verifyJwtToken(token: string): Promise<UserSessionPayload | null> {
  try {
    const verified = await jwtVerify(token, JWT_SECRET);
    return verified.payload as unknown as UserSessionPayload;
  } catch (err) {
    return null;
  }
}

export async function getSessionUser(req?: Request): Promise<UserSessionPayload | null> {
  let token: string | undefined;

  // 1. Try reading from Authorization Header (Bearer <token>)
  if (req) {
    const authHeader = req.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    }
  }

  // 2. Try reading from Cookies if token not in auth header
  if (!token) {
    try {
      const cookieStore = cookies();
      token = cookieStore.get("loop_session")?.value;
    } catch {
      // ignore
    }
  }

  if (!token) return null;
  return await verifyJwtToken(token);
}

export function enforceRole(
  sessionUser: UserSessionPayload | null,
  allowedRoles: ("ADMIN" | "ANALYST" | "VIEWER")[]
): NextResponse | null {
  if (!sessionUser) {
    return NextResponse.json({ error: "Unauthorized: Login required" }, { status: 401 });
  }

  if (!allowedRoles.includes(sessionUser.role)) {
    return NextResponse.json(
      { error: `Forbidden: Role '${sessionUser.role}' is not authorized for this action.` },
      { status: 403 }
    );
  }

  return null; // Authorization passed
}
