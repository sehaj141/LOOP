import { db } from "@/lib/db";
import { getSessionUser } from "@/lib/auth";
import { answerAskLoop } from "@/lib/ai";
import { searchFeedbackSemantics } from "@/lib/search";
import { NextResponse } from "next/server";
import { z } from "zod";

const AskSchema = z.object({
  question: z.string().min(3, "Question must be at least 3 characters"),
});

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const { question } = AskSchema.parse(body);

    // Fetch all feedback in workspace with embeddings (Tenant Isolation)
    const items = await db.feedback.findMany({
      where: { workspaceId: user.workspaceId },
      include: { embedding: true },
    });

    if (items.length === 0) {
      return NextResponse.json({
        answer: "No customer feedback items exist in your workspace to answer this question. Try adding feedback or running simulated channel ingestion.",
        citedItems: [],
      });
    }

    // Perform vector semantic search
    const searchResults = searchFeedbackSemantics(question, items, 6);

    const contextItems = searchResults.map((r) => ({
      id: r.item.id,
      content: r.item.content,
      channel: r.item.channel,
      sentiment: r.item.sentiment,
      featureArea: r.item.featureArea,
    }));

    // Generate grounded answer
    const result = await answerAskLoop(question, contextItems);

    // Hydrate cited item details
    const citedItems = searchResults.map((r) => ({
      id: r.item.id,
      content: r.item.content,
      channel: r.item.channel,
      sentiment: r.item.sentiment,
      featureArea: r.item.featureArea,
      createdAt: r.item.createdAt,
      relevanceScore: parseFloat(r.score.toFixed(2)),
    }));

    return NextResponse.json({
      answer: result.answer,
      citedItems,
    });
  } catch (err: any) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors[0].message }, { status: 400 });
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
