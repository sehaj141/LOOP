import { db } from "@/lib/db";
import { getSessionUser, enforceRole } from "@/lib/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

const UpdateFeedbackSchema = z.object({
  status: z.enum(["NEW", "REVIEWED", "ACTIONED"]).optional(),
  content: z.string().optional(),
});

export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  const roleGuard = enforceRole(user, ["ADMIN", "ANALYST"]);
  if (roleGuard) return roleGuard;

  try {
    const feedbackId = params.id;

    // Verify item belongs to caller's workspace (Tenant Isolation)
    const existing = await db.feedback.findFirst({
      where: { id: feedbackId, workspaceId: user!.workspaceId },
    });

    if (!existing) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
    }

    const body = await req.json();
    const validated = UpdateFeedbackSchema.parse(body);

    const updated = await db.feedback.update({
      where: { id: feedbackId },
      data: validated,
      include: {
        feedbackThemes: {
          include: { theme: true },
        },
      },
    });

    return NextResponse.json({ feedback: updated });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  const user = await getSessionUser(req);
  const roleGuard = enforceRole(user, ["ADMIN", "ANALYST"]);
  if (roleGuard) return roleGuard;

  const feedbackId = params.id;

  const existing = await db.feedback.findFirst({
    where: { id: feedbackId, workspaceId: user!.workspaceId },
  });

  if (!existing) {
    return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
  }

  await db.feedback.delete({
    where: { id: feedbackId },
  });

  return NextResponse.json({ success: true });
}
