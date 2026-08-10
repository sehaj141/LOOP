import { db } from "@/lib/db";
import { getSessionUser, enforceRole } from "@/lib/auth";
import { classifyFeedback } from "@/lib/ai";
import { generateEmbedding } from "@/lib/search";
import { NextResponse } from "next/server";

const SIMULATED_FEEDBACK = [
  { channel: "Support Ticket", content: "Checkout modal freezes when clicking 'Pay with Paypal' on Safari iOS." },
  { channel: "App Store Review", content: "Love the dark mode aesthetic! Navigation feels buttery smooth now." },
  { channel: "NPS Survey", content: "Would recommend to peers, but please add automated weekly PDF email exports." },
  { channel: "Sales Call Note", content: "Prospect requested SOC-2 compliance report and SAML 2.0 single sign-on." },
  { channel: "Community Post", content: "Is anyone else experiencing 504 gateway timeouts on the CSV bulk upload feature today?" },
  { channel: "Support Ticket", content: "Password reset link expired in 2 minutes. Please increase expiration window to 15 mins." },
  { channel: "App Store Review", content: "Recent app update broke push notifications for new feedback alerts." },
];

export async function POST(req: Request) {
  const user = await getSessionUser(req);
  const roleGuard = enforceRole(user, ["ADMIN", "ANALYST"]);
  if (roleGuard) return roleGuard;

  const randomTmpl = SIMULATED_FEEDBACK[Math.floor(Math.random() * SIMULATED_FEEDBACK.length)];
  const randomNum = Math.floor(Math.random() * 900) + 100;

  const existingThemes = await db.theme.findMany({
    where: { workspaceId: user!.workspaceId },
    select: { name: true, id: true },
  });
  const themeMap = new Map(existingThemes.map((t) => [t.name, t.id]));

  const aiResult = await classifyFeedback(
    randomTmpl.content,
    Array.from(themeMap.keys())
  );

  const feedback = await db.feedback.create({
    data: {
      content: randomTmpl.content,
      channel: randomTmpl.channel,
      sourceRef: `SIM-${Date.now()}`,
      customerLabel: `SimUser_${randomNum}`,
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
        confidence: 0.95,
      },
    });
  }

  const vecStr = JSON.stringify(generateEmbedding(randomTmpl.content));
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
}
