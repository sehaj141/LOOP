import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

const FEATURE_VOCAB = [
  "onboarding", "signup", "invite", "login", "auth", "password", "sso", "security",
  "billing", "invoice", "payment", "pricing", "checkout", "subscription", "plan",
  "dashboard", "analytics", "chart", "report", "export", "csv", "data", "speed",
  "bug", "crash", "error", "slow", "timeout", "broken", "mobile", "app", "ios",
  "android", "ui", "ux", "design", "layout", "font", "navigation", "search", "filter",
  "support", "chat", "help", "ticket", "response", "feature", "request", "integration",
  "api", "webhook", "notification", "email", "performance", "latency", "loading",
  "gorgeous", "love", "awesome", "terrible", "hate", "frustrating", "confusing", "fast"
];

function generateVector(text: string): string {
  const normalized = text.toLowerCase();
  const tokens = normalized.match(/\w+/g) || [];
  const tokenSet = new Set(tokens);
  const dim = 64;
  const vector = new Array(dim).fill(0);

  FEATURE_VOCAB.slice(0, dim).forEach((feature, idx) => {
    if (tokenSet.has(feature) || normalized.includes(feature)) {
      vector[idx] += 1.0;
    }
  });

  tokens.forEach((token) => {
    let hash = 0;
    for (let i = 0; i < token.length; i++) {
      hash = (hash << 5) - hash + token.charCodeAt(i);
      hash |= 0;
    }
    const idx = Math.abs(hash) % dim;
    vector[idx] += 0.2;
  });

  const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));
  if (norm > 0) {
    for (let i = 0; i < dim; i++) {
      vector[i] = parseFloat((vector[i] / norm).toFixed(4));
    }
  }

  return JSON.stringify(vector);
}

async function main() {
  console.log("🌱 Starting Project LOOP database seeding...");

  // Clear existing records
  await prisma.report.deleteMany({});
  await prisma.embedding.deleteMany({});
  await prisma.feedbackTheme.deleteMany({});
  await prisma.theme.deleteMany({});
  await prisma.feedback.deleteMany({});
  await prisma.user.deleteMany({});
  await prisma.workspace.deleteMany({});

  // 1. Create Demo Workspace
  const workspace = await prisma.workspace.create({
    data: {
      name: "Acme Corp",
    },
  });

  console.log(`✅ Created Workspace: ${workspace.name} (${workspace.id})`);

  // 2. Create Users (Admin, Analyst, Viewer)
  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Alice Admin",
      email: "admin@acme.com",
      passwordHash,
      role: "ADMIN",
      workspaceId: workspace.id,
    },
  });

  const analyst = await prisma.user.create({
    data: {
      name: "Bob Analyst",
      email: "analyst@acme.com",
      passwordHash,
      role: "ANALYST",
      workspaceId: workspace.id,
    },
  });

  const viewer = await prisma.user.create({
    data: {
      name: "Charlie Viewer",
      email: "viewer@acme.com",
      passwordHash,
      role: "VIEWER",
      workspaceId: workspace.id,
    },
  });

  console.log(`✅ Created Demo Users: ${admin.email} (ADMIN), ${analyst.email} (ANALYST), ${viewer.email} (VIEWER)`);

  // 3. Create Themes
  const themesData = [
    { name: "Team Onboarding & Invites", description: "Feedback regarding user sign-up, team invites, and workspace setup", color: "#6366f1" },
    { name: "Enterprise SSO & Security", description: "Single sign-on, SAML, 2FA, and security requirements", color: "#8b5cf6" },
    { name: "Billing & Invoice Timeouts", description: "Issues with checkout, invoice PDF downloads, and payments", color: "#ef4444" },
    { name: "Dashboard Speed & Performance", description: "Feedback on analytics rendering, table load times, and charts", color: "#10b981" },
    { name: "Mobile App Experience", description: "iOS and Android mobile web responsiveness and app layout", color: "#f59e0b" },
    { name: "Data Export & Integrations", description: "CSV export, API webhooks, and third-party integrations", color: "#06b6d4" },
  ];

  const createdThemes: Record<string, string> = {};
  for (const t of themesData) {
    const theme = await prisma.theme.create({
      data: {
        name: t.name,
        description: t.description,
        color: t.color,
        workspaceId: workspace.id,
      },
    });
    createdThemes[t.name] = theme.id;
  }
  console.log(`✅ Created ${Object.keys(createdThemes).length} Themes`);

  // 4. Generate 125 realistic feedback items spanning 30 days
  const channels = ["Support Ticket", "App Store Review", "NPS Survey", "Sales Call Note", "Community Post"];
  
  const sampleTemplates = [
    { content: "Onboarding took forever — I couldn't figure out how to invite my team members.", channel: "Support Ticket", sentiment: "NEG", sentimentScore: -0.7, featureArea: "Onboarding", theme: "Team Onboarding & Invites" },
    { content: "The new analytics dashboard is gorgeous and finally fast! Huge improvement over last month.", channel: "App Store Review", sentiment: "POS", sentimentScore: 0.9, featureArea: "Analytics & Reports", theme: "Dashboard Speed & Performance" },
    { content: "Prospect insists on SSO support before signing enterprise deal. Third time requested this month.", channel: "Sales Call Note", sentiment: "NEG", sentimentScore: -0.6, featureArea: "Authentication & Security", theme: "Enterprise SSO & Security" },
    { content: "Billing page keeps timing out when I try to download an invoice. Had to contact support twice.", channel: "Support Ticket", sentiment: "NEG", sentimentScore: -0.8, featureArea: "Billing", theme: "Billing & Invoice Timeouts" },
    { content: "Love the new CSV export feature, saved me an hour of manual spreadsheet building today!", channel: "Community Post", sentiment: "POS", sentimentScore: 0.85, featureArea: "Analytics & Reports", theme: "Data Export & Integrations" },
    { content: "Mobile experience needs work. Table columns overlap on smaller iPhone screens.", channel: "NPS Survey", sentiment: "NEU", sentimentScore: -0.2, featureArea: "Mobile App", theme: "Mobile App Experience" },
    { content: "Super clean UI and seamless team invite workflow. My team was up and running in 5 minutes.", channel: "App Store Review", sentiment: "POS", sentimentScore: 0.95, featureArea: "Onboarding", theme: "Team Onboarding & Invites" },
    { content: "Our compliance team requires SAML 2.0 SSO and Okta integration before we can upgrade to Enterprise tier.", channel: "Sales Call Note", sentiment: "NEU", sentimentScore: 0.1, featureArea: "Authentication & Security", theme: "Enterprise SSO & Security" },
    { content: "Credit card payment failed with generic error code. Please fix checkout error handling.", channel: "Support Ticket", sentiment: "NEG", sentimentScore: -0.75, featureArea: "Billing", theme: "Billing & Invoice Timeouts" },
    { content: "Chart filters reset every time I refresh the page. Please persist selected date ranges.", channel: "Community Post", sentiment: "NEU", sentimentScore: -0.3, featureArea: "Analytics & Reports", theme: "Dashboard Speed & Performance" },
    { content: "Customer support responded in under 2 minutes and resolved my API webhook issue instantly!", channel: "Support Ticket", sentiment: "POS", sentimentScore: 0.9, featureArea: "Integrations", theme: "Data Export & Integrations" },
    { content: "App crashes when opening large PDF reports on Android tablets.", channel: "App Store Review", sentiment: "NEG", sentimentScore: -0.8, featureArea: "Mobile App", theme: "Mobile App Experience" },
    { content: "Is there a public API endpoint to pull aggregated sentiment scores directly into our internal BI tools?", channel: "Community Post", sentiment: "NEU", sentimentScore: 0.0, featureArea: "Integrations", theme: "Data Export & Integrations" },
    { content: "Can we get role-based permissions so Viewers cannot accidentally delete customer feedback entries?", channel: "NPS Survey", sentiment: "NEU", sentimentScore: 0.0, featureArea: "Authentication & Security", theme: "Enterprise SSO & Security" },
    { content: "Invoice email receipts don't attach the tax invoice PDF automatically. Please fix this flow.", channel: "Support Ticket", sentiment: "NEG", sentimentScore: -0.5, featureArea: "Billing", theme: "Billing & Invoice Timeouts" },
  ];

  const now = new Date();
  const statuses = ["NEW", "REVIEWED", "ACTIONED"];

  console.log("⏳ Generating 125 realistic customer feedback records...");

  for (let i = 0; i < 125; i++) {
    const tmpl = sampleTemplates[i % sampleTemplates.length];
    
    // Vary text slightly for realism
    const variationSuffix = i >= sampleTemplates.length ? ` (Reference ticket #${1000 + i})` : "";
    const fullContent = tmpl.content + variationSuffix;
    
    // Random date within past 30 days
    const daysAgo = Math.floor(Math.random() * 30);
    const createdAt = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
    const status = statuses[i % statuses.length];
    const customerLabel = `Customer_${100 + (i % 20)}`;

    const feedback = await prisma.feedback.create({
      data: {
        content: fullContent,
        channel: tmpl.channel,
        sourceRef: `REF-${2000 + i}`,
        customerLabel,
        sentiment: tmpl.sentiment,
        sentimentScore: tmpl.sentimentScore,
        featureArea: tmpl.featureArea,
        rationale: `Classified automatically during seed ingestion for area ${tmpl.featureArea}.`,
        status,
        createdAt,
        workspaceId: workspace.id,
      },
    });

    // Attach Theme relationship
    const themeId = createdThemes[tmpl.theme];
    if (themeId) {
      await prisma.feedbackTheme.create({
        data: {
          feedbackId: feedback.id,
          themeId: themeId,
          confidence: 0.92,
        },
      });
    }

    // Attach Vector Embedding
    await prisma.embedding.create({
      data: {
        feedbackId: feedback.id,
        vector: generateVector(fullContent),
      },
    });
  }

  // 5. Create a sample VoC Report
  await prisma.report.create({
    data: {
      title: "Voice of Customer Executive Report - Past 30 Days",
      periodStart: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
      periodEnd: now,
      workspaceId: workspace.id,
      generatedById: admin.id,
      contentJson: JSON.stringify({
        title: "Voice of Customer Executive Report - Past 30 Days",
        executiveSummary: "Analysis of 125 customer feedback items shows strong enthusiasm for recent analytics dashboard performance upgrades (+35% positive sentiment). However, onboarding friction and missing enterprise SSO features represent the top churn drivers.",
        sentimentAnalysis: {
          overallTone: "Action Required on Onboarding & Security",
          positivePercentage: 42,
          neutralPercentage: 25,
          negativePercentage: 33,
          shiftDescription: "Negative feedback increased 18% week-over-week due to enterprise SSO requests from sales calls.",
        },
        topThemes: [
          { themeName: "Team Onboarding & Invites", count: 32, sentiment: "NEG", insight: "Multiple users struggle with adding team members during initial workspace setup." },
          { themeName: "Enterprise SSO & Security", count: 28, sentiment: "NEG", insight: "Blocker for 3 large sales opportunities this month." },
          { themeName: "Dashboard Speed & Performance", count: 25, sentiment: "POS", insight: "Highly praised after recent release." },
        ],
        verbatimQuotes: [
          { quote: "Onboarding took forever — I couldn't figure out how to invite my team members.", channel: "Support Ticket", sentiment: "NEG" },
          { quote: "Prospect insists on SSO support before signing enterprise deal.", channel: "Sales Call Note", sentiment: "NEG" },
          { quote: "The new analytics dashboard is gorgeous and finally fast!", channel: "App Store Review", sentiment: "POS" },
        ],
        recommendedActions: [
          { priority: "HIGH", title: "Redesign Team Invitation Flow", description: "Add inline team invite step during onboarding wizard." },
          { priority: "HIGH", title: "Build SAML/Okta SSO Integration", description: "Unblock $150k ARR pipeline by shipping enterprise SSO." },
          { priority: "MEDIUM", title: "Optimize Invoice Download Endpoint", description: "Fix PDF timeouts on billing settings page." },
        ],
      }),
    },
  });

  console.log("🎉 Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
