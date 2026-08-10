import { db } from "@/lib/db";
import { getSessionUser, enforceRole } from "@/lib/auth";
import { generateVoCReportNarrative } from "@/lib/ai";
import { NextResponse } from "next/server";
import { z } from "zod";

const GenerateReportSchema = z.object({
  days: z.number().default(30),
});

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const reports = await db.report.findMany({
    where: { workspaceId: user.workspaceId },
    include: {
      generatedBy: {
        select: { name: true, email: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ reports });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  // Admin & Analyst can generate reports
  const roleGuard = enforceRole(user, ["ADMIN", "ANALYST"]);
  if (roleGuard) return roleGuard;

  try {
    const body = await req.json().catch(() => ({}));
    const { days } = GenerateReportSchema.parse(body);

    const now = new Date();
    const periodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

    // 1. Fetch feedback within period (Tenant Isolation)
    const feedbackItems = await db.feedback.findMany({
      where: {
        workspaceId: user!.workspaceId,
        createdAt: { gte: periodStart },
      },
      include: {
        feedbackThemes: {
          include: { theme: true },
        },
      },
    });

    const totalItems = feedbackItems.length;

    // 2. Pre-compute sentiment stats
    let pos = 0, neu = 0, neg = 0;
    feedbackItems.forEach((item) => {
      if (item.sentiment === "POS") pos++;
      else if (item.sentiment === "NEG") neg++;
      else neu++;
    });

    // 3. Pre-compute top themes
    const themeCounts: Record<string, { count: number; negCount: number }> = {};
    feedbackItems.forEach((item) => {
      item.feedbackThemes.forEach((ft) => {
        const name = ft.theme.name;
        if (!themeCounts[name]) themeCounts[name] = { count: 0, negCount: 0 };
        themeCounts[name].count++;
        if (item.sentiment === "NEG") themeCounts[name].negCount++;
      });
    });

    const topThemes = Object.entries(themeCounts)
      .map(([name, data]) => ({
        name,
        count: data.count,
        sentiment: data.negCount > data.count * 0.4 ? "Negative Friction" : "Generally Positive",
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // 4. Sample verbatim quotes
    const quotes = feedbackItems.slice(0, 6).map((item) => ({
      content: item.content,
      channel: item.channel,
      sentiment: item.sentiment,
    }));

    // 5. Generate AI Narrative Report
    const periodTitle = `Past ${days} Days (${periodStart.toLocaleDateString()} - ${now.toLocaleDateString()})`;
    const reportData = await generateVoCReportNarrative(
      periodTitle,
      totalItems,
      { pos, neu, neg },
      topThemes,
      quotes
    );

    // 6. Save Report to Database
    const report = await db.report.create({
      data: {
        title: reportData.title,
        periodStart,
        periodEnd: now,
        contentJson: JSON.stringify(reportData),
        workspaceId: user!.workspaceId,
        generatedById: user!.userId,
      },
      include: {
        generatedBy: {
          select: { name: true, email: true },
        },
      },
    });

    return NextResponse.json({ report });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Server Error" }, { status: 500 });
  }
}
