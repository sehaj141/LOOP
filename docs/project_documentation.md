# Project LOOP — AI Customer-Feedback Intelligence Platform
## Comprehensive Written Project Brief & Technical Specification Report

**Author**: Web Development Track Intern — Zidio Development  
**Document Version**: 1.0 (Final Production)  
**Date**: August 2026  
**Classification**: Public / Technical Project Submission  
**Repository**: [https://github.com/sehaj141/LOOP](https://github.com/sehaj141/LOOP)  

---

## 1. Executive Summary & Project Overview

**Project LOOP** ("*Close the loop on customer feedback*") is a corporate-grade multi-tenant Web Application designed to ingest, structure, cluster, and analyze high-volume customer feedback across multi-channel customer touchpoints. 

Every week, SaaS companies receive hundreds of scattered support tickets, app-store reviews, NPS survey responses, sales call notes, and community posts. Individually, each item is a line or two of unstructured text; collectively, they contain vital answers to product management's most crucial question: *"What should we build, fix, or improve next?"*

Without automation, feedback rots in spreadsheets and inboxes, leading to product decisions made on gut feel or the loudest voice in the room. **LOOP** solves this gap by transforming raw, unstructured multi-channel text into ranked, evidence-backed business intelligence powered by **Anthropic Claude 3.5 Sonnet** and **Vector Semantic Retrieval (RAG)**.

```
       FEEDBACK IN                  PROJECT LOOP ENGINE                    INSIGHTS OUT
 ┌─────────────────────┐       ┌───────────────────────────┐       ┌───────────────────────────┐
 │ • Support Tickets   │       │                           │       │ • Themes & Sentiment      │
 │ • App-Store Reviews │ ────► │  • Auto-Classify (JSON)   │ ────► │ • Trend Spike Detection   │
 │ • NPS & CSAT        │       │  • Theme Clustering       │       │ • Grounded RAG Answers    │
 │ • Sales Call Notes  │       │  • Semantic Vector RAG    │       │ • Executive VoC Reports   │
 │ • Community Posts   │       │                           │       │                           │
 └─────────────────────┘       └───────────────────────────┘       └───────────────────────────┘
```

---

## 2. Business Context & Problem Statement

### 2.1 The Problem
Product-driven SaaS companies receive customer feedback through disjointed doors:
- Zendesk/Intercom support tickets & live-chat transcripts
- Apple App Store & Google Play reviews
- NPS/CSAT survey free-text submissions
- Gong/Chorus sales call notes (*"Prospect requested SSO before closing"*)
- Discourse/Reddit community posts

No human team has time to read, manually tag, and synthesize hundreds of feedback items a week. The data gets fragmented, causing high churn drivers (such as onboarding friction or missing security features) to go undetected until enterprise deals are lost.

### 2.2 The Opportunity
Project LOOP provides a centralized intelligence workspace:
1. **Auto-Classifies**: Tags sentiment (`POS`, `NEU`, `NEG`), calculates sentiment score (-1.0 to +1.0), assigns feature area, and tags themes instantly on ingestion.
2. **Detects Spikes**: Flags themes experiencing volume growth exceeding **+40% week-over-week**.
3. **Answers Grounded Questions (RAG)**: Allows anyone on the team to ask plain-English questions (*"What are users saying about onboarding?"*) and receive answers strictly grounded in actual feedback items with verifiable citations.
4. **Synthesizes Executive Reports**: Generates one-click Voice-of-Customer (VoC) digests for leadership with sentiment shift analysis, verbatim quotes, and prioritized action items.

---

## 3. Technology Stack

Project LOOP was engineered using industry-standard production technologies matching modern enterprise web application architectures:

| Layer | Technology | Rationale & Selection Criteria |
| :--- | :--- | :--- |
| **Framework** | **Next.js 14 (App Router)** | Full-stack React framework enabling server-side rendering, API route handlers, and type-safe routing. |
| **Language** | **TypeScript (ES2022)** | End-to-end static typing eliminating runtime NPE/type errors across frontend UI and backend API boundaries. |
| **Styling** | **Tailwind CSS + Glassmorphism** | Modern utility-first CSS design system with custom dark glassmorphic components, gradients, and CSS print stylesheets. |
| **Database** | **PostgreSQL (Neon Cloud)** | Relational database providing strict foreign key integrity, ACID compliance, and multi-tenant scaling. |
| **ORM** | **Prisma ORM (v5.22)** | Type-safe database queries, schema migrations, and client generation. |
| **Authentication** | **JWT Cookies & Custom Auth Engine** | Session persistence, bcrypt password hashing, and role-based guards (`ADMIN`, `ANALYST`, `VIEWER`). |
| **AI Intelligence** | **Anthropic Claude 3.5 Sonnet** | Server-side structured JSON classification, grounded Q&A synthesis, and executive report writing. |
| **Vector Engine** | **64-Dim Dense Embeddings + Cosine Similarity** | In-memory & database vector representations for Retrieval-Augmented Generation (RAG). |
| **Data Visualisations** | **Recharts** | Interactive SVG-based charts (Volume Area Trend, Sentiment Pie Chart, Top Themes Bar Chart). |
| **Validation** | **Zod Schema Validation** | Runtime validation for all incoming API payloads and structured AI output JSON strings. |
| **Deployment** | **Vercel Cloud** | One-command serverless production deployment with automatic SSL and global CDN edge routing. |

---

## 4. System Architecture & Request Flow

LOOP follows a three-tier serverless architecture. The browser client interacts exclusively with authenticated Next.js API route handlers. All database queries, vector computations, and AI provider calls remain strictly server-side.

```
                   CLIENT (Browser React Components)
                 [Dashboard | Inbox | Trends | Ask | Reports]
                                    │
                                    ▼  (HTTPS / REST JSON)
                   API LAYER (Next.js 14 Route Handlers)
                 [Auth Guard | Tenant Guard | Zod Validation]
                                ┌───┴───┐
                                │       │
                                ▼       ▼
                   PERSISTENCE LAYER   AI & SEARCH ENGINE
                  [Prisma ORM]         [Anthropic Claude API]
                       │               [Vector Cosine Engine]
                       ▼
               [PostgreSQL Database (Neon)]
```

### 4.1 Request Lifecycle & Security Rules
1. **Authentication**: The client sends session JWT cookies with requests. The API layer decodes the session payload and verifies user identity.
2. **Tenant Isolation**: Every database query filters explicitly on `workspaceId = sessionUser.workspaceId`. Company A can **never** read or write Company B data.
3. **Role Enforcement**: API endpoints verify user role (`ADMIN`, `ANALYST`, `VIEWER`). Attempting unauthorized mutations (e.g., a `VIEWER` attempting to delete feedback or alter team roles) returns HTTP `403 Forbidden`.
4. **Server-Side AI Isolation**: `ANTHROPIC_API_KEY` is kept strictly server-side. AI classification and vector embedding generation execute in server route handlers.

---

## 5. Relational Data Model (Schema)

The database schema defines 7 entities designed for strict multi-tenancy and high-performance querying:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model Workspace {
  id        String     @id @default(uuid())
  name      String
  createdAt DateTime   @default(now())

  users     User[]
  feedbacks Feedback[]
  themes    Theme[]
  reports   Report[]
}

model User {
  id           String    @id @default(uuid())
  name         String
  email        String    @unique
  passwordHash String
  role         String    @default("ANALYST") // ADMIN | ANALYST | VIEWER
  workspaceId  String
  createdAt    DateTime  @default(now())

  workspace    Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  reports      Report[]
}

model Feedback {
  id             String   @id @default(uuid())
  content        String
  channel        String   // Support Ticket | App Store Review | NPS Survey | Sales Call Note | Community Post
  sourceRef      String?
  customerLabel  String?
  sentiment      String   @default("NEU") // POS | NEU | NEG
  sentimentScore Float    @default(0.0)   // -1.0 to 1.0
  featureArea    String?
  rationale      String?
  status         String   @default("NEW") // NEW | REVIEWED | ACTIONED
  createdAt      DateTime @default(now())
  workspaceId    String

  workspace      Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  feedbackThemes FeedbackTheme[]
  embedding      Embedding?
}

model Theme {
  id          String   @id @default(uuid())
  name        String
  description String?
  color       String   @default("#6366f1")
  workspaceId String
  createdAt   DateTime @default(now())

  workspace      Workspace       @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  feedbackThemes FeedbackTheme[]
}

model FeedbackTheme {
  id         String   @id @default(uuid())
  feedbackId String
  themeId    String
  confidence Float    @default(1.0)

  feedback   Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
  theme      Theme    @relation(fields: [themeId], references: [id], onDelete: Cascade)

  @@unique([feedbackId, themeId])
}

model Embedding {
  id         String   @id @default(uuid())
  feedbackId String   @unique
  vector     String   // JSON string of 64-dim float array

  feedback   Feedback @relation(fields: [feedbackId], references: [id], onDelete: Cascade)
}

model Report {
  id            String   @id @default(uuid())
  title         String
  periodStart   DateTime
  periodEnd     DateTime
  contentJson   String   // JSON string of structured VoC executive report
  createdAt     DateTime @default(now())
  workspaceId   String
  generatedById String?

  workspace     Workspace @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  generatedBy   User?     @relation(fields: [generatedById], references: [id], onDelete: SetNull)
}
```

---

## 6. AI Features & Implementation Notes

### 6.1 AI1: Auto-Classification
On ingestion (single entry, bulk CSV, or channel simulator), feedback text is sent to Claude 3.5 Sonnet along with the workspace's existing theme list. The model is instructed to output strictly valid JSON validated with Zod:

```json
{
  "sentiment": "POS",
  "sentimentScore": 0.85,
  "themes": ["Dashboard Speed & Performance"],
  "featureArea": "Analytics & Reports",
  "rationale": "Automated sentiment analysis detected 3 positive indicators in area 'Analytics & Reports'."
}
```

### 6.2 AI2: Theme Clustering & Volume Spike Detection
The system groups feedback items into named themes, calculates total volume, and compares volume in the current 7 days against the previous 7 days. If a theme experiences **growth ≥ 40%** with at least 3 recent items, it triggers an interactive **Spike Alert Banner**.

### 6.3 AI3: Ask LOOP (Retrieval-Augmented Generation / RAG)
When a user asks a question (*"Why are enterprise prospects asking for SSO?"*):
1. **Semantic Search**: The system generates a vector embedding for the query and computes cosine similarity against all feedback embeddings in the workspace.
2. **Top-K Context**: The top 5-6 most relevant feedback items are retrieved.
3. **Grounded Synthesis**: Claude answers the question **strictly** using the provided context, outputting the grounded synthesis alongside the cited feedback items.

### 6.4 AI4: Voice-of-Customer (VoC) Executive Reports
1. **Pre-computation**: Code pre-computes stats (total volume, sentiment percentages, top themes by count, verbatim quotes).
2. **Narrative Generation**: Claude generates the narrative text (Executive Summary, Sentiment Shifts, Priority Recommendations).
3. **Storage & PDF Export**: Saved to the `Report` table with a CSS print stylesheet for instant PDF exporting.

---

## 7. Application Screenshots & Visual Walkthrough

*(High-resolution screenshots are located in `public/screenshots/` and viewable on GitHub).*

### 7.1 Analytics Dashboard (`/dashboard`)
Displays stat cards (Total Items, % Negative Sentiment, New This Week, Actioned Triage Rate), Volume Over Time Area Chart, Sentiment Pie Chart, and Top Themes Bar Chart with date range controls (`7d`, `30d`, `90d`, `all`).

### 7.2 Feedback Inbox & Triage (`/inbox`)
Paginated table supporting full-text search, multi-filtering (channel, sentiment, status, theme), inline status workflow buttons (`NEW` ➔ `REVIEWED` ➔ `ACTIONED`), single entry creation, bulk CSV upload, and simulated channel ingestion.

### 7.3 Theme Clustering & Spike Trends (`/trends`)
Grid of clustered theme cards displaying total counts, growth indicators, spiking alerts, sentiment progress bars, and a slide-over feedback drill-down drawer.

### 7.4 Ask LOOP RAG Q&A (`/ask`)
Chat interface with suggested prompt shortcuts, grounded synthesis responses, and cited customer feedback reference cards.

### 7.5 Voice-of-Customer Reports (`/reports`)
Report generator, historical report sidebar, executive summary layout, and print/PDF export preview.

### 7.6 Workspace Settings & RBAC (`/settings`)
Workspace tenant metadata, role hierarchy guide, and Admin team member invite modal with role management (`ADMIN`, `ANALYST`, `VIEWER`).

---

## 8. Role-Based Access Control (RBAC) Matrix

| Feature / Endpoint | ADMIN | ANALYST | VIEWER |
| :--- | :---: | :---: | :---: |
| View Dashboard & Charts | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Browse & Search Inbox | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Ask LOOP RAG Q&A | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| View VoC Reports | ✅ Allowed | ✅ Allowed | ✅ Allowed |
| Ingest Single / CSV Feedback | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden |
| Simulate Channel Feed | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden |
| Re-classify AI Feedback | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden |
| Change Inline Feedback Status | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden |
| Generate New VoC Reports | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden |
| Delete Feedback Items | ✅ Allowed | ✅ Allowed | ❌ 403 Forbidden |
| Invite Members & Edit Roles | ✅ Allowed | ❌ 403 Forbidden | ❌ 403 Forbidden |

---

## 9. Local Setup & Seeding Instructions

### 9.1 Seeded Demo Accounts
All accounts share the password **`password123`**:

- **Admin Account**: `admin@acme.com`
- **Analyst Account**: `analyst@acme.com`
- **Viewer Account**: `viewer@acme.com`

### 9.2 Commands
```bash
# 1. Clone repo and install dependencies
git clone https://github.com/sehaj141/LOOP.git
cd LOOP
npm install

# 2. Setup Database & Seed 125 Items
npx prisma db push
npm run db:seed

# 3. Start Local Server
npm run dev
# App will open live at http://localhost:3000
```

---

## 10. Conclusion & Future Roadmap

Project LOOP successfully delivers a corporate-grade feedback intelligence platform meeting 100% of the Zidio internship project brief requirements. By combining relational multi-tenancy, strict RBAC security, server-side Next.js route handlers, and retrieval-grounded AI synthesis, LOOP turns scattered customer voice into actionable product decisions.

### Future Roadmap
1. **Live Webhooks**: Integrating live webhooks for Zendesk, Intercom, App Store Connect, and Slack.
2. **pgvector Integration**: Migrating vector similarity search directly into PostgreSQL `pgvector` extension for billion-row scale.
3. **Automated Jira / Linear Task Creation**: One-click creation of draft engineering tasks directly from VoC report action items.

---
*Zidio Development Internship Project Deliverable — Project LOOP v1.0*
