import { db } from "@/lib/db";
import { getSessionUser, enforceRole } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  const roleGuard = enforceRole(user, ["ADMIN", "ANALYST"]);
  if (roleGuard) return roleGuard;

  try {
    const { feedbackId } = await req.json();
    if (!feedbackId) {
      return NextResponse.json({ error: "feedbackId required" }, { status: 400 });
    }

    const feedback = await db.feedback.findFirst({
      where: { id: feedbackId, workspaceId: user!.workspaceId },
    });

    if (!feedback) {
      return NextResponse.json({ error: "Feedback item not found" }, { status: 404 });
    }

    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user!.workspaceId },
      select: { name: true, id: true },
    });
    const themeMap = new Map(existingThemes.map((t) => [t.name, t.id]));

    const aiResult = await classifyFeedback(
      feedback.content,
      Array.from(themeMap.keys())
    );

    // Remove existing themes for this item
    await db.feedbackTheme.deleteMany({
      where: { feedbackId: feedback.id },
    });

    // Update feedback record
    const updated = await db.feedback.update({
      where: { id: feedback.id },
      data: {
        sentiment: aiResult.sentiment,
        sentimentScore: aiResult.sentimentScore,
        featureArea: aiResult.featureArea,
        rationale: aiResult.rationale,
      },
    });

    for (const themeName of aiResult.themes) {
      let themeId = themeMap.get(themeName);
      if (!themeId) {
        const newTheme = await db.theme.create({
          data: {
            name: themeName,
            workspaceId: user!.workspaceId,
            color: "#6366f1",
          },
        });
        themeId = newTheme.id;
        themeMap.set(themeName, themeId);
      }

      await db.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId,
          confidence: 0.95,
        },
      });
    }

    const result = await db.feedback.findUnique({
      where: { id: feedback.id },
      include: {
        feedbackThemes: {
          include: { theme: true },
        },
      },
    });

    return NextResponse.json({ feedback: result });
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || "Server Error" }, { status: 500 });
  }
}
