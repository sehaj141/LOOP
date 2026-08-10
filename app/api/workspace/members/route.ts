import { db } from "@/lib/db";
import { getSessionUser, enforceRole, hashPassword } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const AddMemberSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]),
});

const UpdateRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(["ADMIN", "ANALYST", "VIEWER"]),
});

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const members = await db.user.findMany({
    where: { workspaceId: user.workspaceId },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json({ members });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  // ADMIN role enforcement
  const roleGuard = enforceRole(user, ["ADMIN"]);
  if (roleGuard) return roleGuard;

  try {
    const body = await req.json();
    const validated = AddMemberSchema.parse(body);

    const existing = await db.user.findUnique({
      where: { email: validated.email.toLowerCase() },
    });

    if (existing) {
      return NextResponse.json({ error: "A user with this email already exists." }, { status: 400 });
    }

    const passwordHash = await hashPassword(validated.password);

    const newMember = await db.user.create({
      data: {
        name: validated.name,
        email: validated.email.toLowerCase(),
        passwordHash,
        role: validated.role,
        workspaceId: user!.workspaceId,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ member: newMember });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  const user = await getSessionUser(req);
  // ADMIN role enforcement
  const roleGuard = enforceRole(user, ["ADMIN"]);
  if (roleGuard) return roleGuard;

  try {
    const body = await req.json();
    const { userId, role } = UpdateRoleSchema.parse(body);

    const targetUser = await db.user.findFirst({
      where: { id: userId, workspaceId: user!.workspaceId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: "User not found in workspace" }, { status: 404 });
    }

    const updated = await db.user.update({
      where: { id: userId },
      data: { role },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ member: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
