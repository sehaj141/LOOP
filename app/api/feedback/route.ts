import { db } from "@/lib/db";
import { getSessionUser, enforceRole } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbedding } from "@/lib/search";
import { NextResponse } from "next/server";
import { z } from "zod";

const SingleFeedbackSchema = z.object({
  content: z.string().min(3, "Content must be at least 3 characters"),
  channel: z.enum([
    "Support Ticket",
    "App Store Review",
    "NPS Survey",
    "Sales Call Note",
    "Community Post",
  ]),
  customerLabel: z.string().optional(),
  sourceRef: z.string().optional(),
});

const BulkCSVFeedbackSchema = z.object({
  items: z.array(SingleFeedbackSchema),
});

export async function GET(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "15");
  const search = searchParams.get("search") || "";
  const channel = searchParams.get("channel");
  const sentiment = searchParams.get("sentiment");
  const status = searchParams.get("status");
  const themeId = searchParams.get("themeId");
  const dateRange = searchParams.get("dateRange"); // "7d", "30d", "90d", "all"

  const whereClause: any = {
    workspaceId: user.workspaceId, // Tenant isolation mandatory
  };

  if (search) {
    whereClause.OR = [
      { content: { contains: search } },
      { customerLabel: { contains: search } },
      { featureArea: { contains: search } },
    ];
  }

  if (channel && channel !== "ALL") whereClause.channel = channel;
  if (sentiment && sentiment !== "ALL") whereClause.sentiment = sentiment;
  if (status && status !== "ALL") whereClause.status = status;

  if (themeId && themeId !== "ALL") {
    whereClause.feedbackThemes = {
      some: { themeId },
    };
  }

  if (dateRange && dateRange !== "all") {
    const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90;
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    whereClause.createdAt = { gte: since };
  }

  const total = await db.feedback.count({ where: whereClause });
  const items = await db.feedback.findMany({
    where: whereClause,
    include: {
      feedbackThemes: {
        include: {
          theme: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return NextResponse.json({
    items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  
  // RBAC Guard: ADMIN & ANALYST can create feedback; VIEWER is forbidden (403)
  const roleGuard = enforceRole(user, ["ADMIN", "ANALYST"]);
  if (roleGuard) return roleGuard;

  try {
    const body = await req.json();

    // Check if bulk CSV import
    if (Array.isArray(body.items)) {
      const parsed = BulkCSVFeedbackSchema.parse(body);
      let importedCount = 0;
      let failedCount = 0;

      // Fetch existing workspace themes for AI theme matching
      const existingThemes = await db.theme.findMany({
        where: { workspaceId: user!.workspaceId },
        select: { name: true, id: true },
      });
      const themeMap = new Map(existingThemes.map((t) => [t.name, t.id]));

      for (const item of parsed.items) {
        try {
          const aiResult = await classifyFeedback(
            item.content,
            Array.from(themeMap.keys())
          );

          const feedback = await db.feedback.create({
            data: {
              content: item.content,
              channel: item.channel,
              sourceRef: item.sourceRef || `CSV-REF-${Date.now()}`,
              customerLabel: item.customerLabel || "CSV Customer",
              sentiment: aiResult.sentiment,
              sentimentScore: aiResult.sentimentScore,
              featureArea: aiResult.featureArea,
              rationale: aiResult.rationale,
              workspaceId: user!.workspaceId,
            },
          });

          // Associate or create Themes
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
                themeId: themeId,
                confidence: 0.9,
              },
            });
          }

          // Create embedding for Ask LOOP vector search
          const vecStr = JSON.stringify(generateEmbedding(item.content));
          await db.embedding.create({
            data: {
              feedbackId: feedback.id,
              vector: vecStr,
            },
          });

          importedCount++;
        } catch (e) {
          failedCount++;
        }
      }

      return NextResponse.json({
        success: true,
        summary: {
          importedCount,
          failedCount,
          total: parsed.items.length,
        },
      });
    }

    // Single item creation
    const validated = SingleFeedbackSchema.parse(body);

    const existingThemes = await db.theme.findMany({
      where: { workspaceId: user!.workspaceId },
      select: { name: true, id: true },
    });
    const themeMap = new Map(existingThemes.map((t) => [t.name, t.id]));

    const aiResult = await classifyFeedback(
      validated.content,
      Array.from(themeMap.keys())
    );

    const feedback = await db.feedback.create({
      data: {
        content: validated.content,
        channel: validated.channel,
        sourceRef: validated.sourceRef || `SINGLE-${Date.now()}`,
        customerLabel: validated.customerLabel || "Individual User",
        sentiment: aiResult.sentiment,
        sentimentScore: aiResult.sentimentScore,
        featureArea: aiResult.featureArea,
        rationale: aiResult.rationale,
        workspaceId: user!.workspaceId,
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
          confidence: 0.9,
        },
      });
    }

    const vecStr = JSON.stringify(generateEmbedding(validated.content));
    await db.embedding.create({
      data: {
        feedbackId: feedback.id,
        vector: vecStr,
      },
    });

    const fullFeedback = await db.feedback.findUnique({
      where: { id: feedback.id },
      include: {
        feedbackThemes: {
          include: { theme: true },
        },
      },
    });

    return NextResponse.json({ feedback: fullFeedback });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: err?.message || "Server Error" }, { status: 500 });
  }
}
