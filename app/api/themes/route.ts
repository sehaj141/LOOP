import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const themes = await db.theme.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      feedbackThemes: {
        include: {
          feedback: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const now = new Date();
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const formattedThemes = themes.map((theme) => {
    const totalCount = theme.feedbackThemes.length;
    
    // Calculate volume in recent 7 days vs previous 7-14 days for spike detection
    let currentWeekCount = 0;
    let previousWeekCount = 0;
    let posCount = 0;
    let neuCount = 0;
    let negCount = 0;

    theme.feedbackThemes.forEach((ft) => {
      const fb = ft.feedback;
      if (fb.createdAt >= sevenDaysAgo) {
        currentWeekCount++;
      } else if (fb.createdAt >= fourteenDaysAgo) {
        previousWeekCount++;
      }

      if (fb.sentiment === "POS") posCount++;
      else if (fb.sentiment === "NEG") negCount++;
      else neuCount++;
    });

    let growthPercent = 0;
    if (previousWeekCount > 0) {
      growthPercent = Math.round(((currentWeekCount - previousWeekCount) / previousWeekCount) * 100);
    } else if (currentWeekCount > 0) {
      growthPercent = 100;
    }

    const isSpiking = growthPercent >= 40 && currentWeekCount >= 3;

    return {
      id: theme.id,
      name: theme.name,
      description: theme.description,
      color: theme.color,
      totalCount,
      currentWeekCount,
      previousWeekCount,
      growthPercent,
      isSpiking,
      sentimentBreakdown: {
        pos: posCount,
        neu: neuCount,
        neg: negCount,
      },
    };
  });

  // Sort by count descending
  formattedThemes.sort((a, b) => b.totalCount - a.totalCount);

  return NextResponse.json({ themes: formattedThemes });
}
