import { db } from "@/lib/db";
import { hashPassword, signJwtToken } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const RegisterSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  workspaceName: z.string().min(2, "Company / Workspace name required"),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = RegisterSchema.parse(body);

    // Check existing user
    const existingUser = await db.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existingUser) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 400 });
    }

    // 1. Create Workspace
    const workspace = await db.workspace.create({
      data: {
        name: validated.workspaceName,
      },
    });

    // 2. Hash password & create ADMIN user
    const passwordHash = await hashPassword(validated.password);
    const user = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: "ADMIN", // First user is Admin
        workspaceId: workspace.id,
      },
    });

    // 3. Create Session Token
    const token = await signJwtToken({
      userId: user.id,
      name: user.name,
      email: user.email,
      role: "ADMIN",
      workspaceId: workspace.id,
      workspaceName: workspace.name,
    });

    const res = NextResponse.json({
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        workspaceId: workspace.id,
        workspaceName: workspace.name,
      },
    });

    res.cookies.set("loop_session", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return res;
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Internal server error" }, { status: 500 });
  }
}
