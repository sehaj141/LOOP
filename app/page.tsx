import Link from "next/link";
import { MessageSquare, Sparkles, Shield, BarChart3, Bot, ArrowRight, CheckCircle2 } from "lucide-react";

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0B0F17] text-white flex flex-col justify-between relative overflow-hidden">
      {/* Glow Effects */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/15 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[300px] bg-purple-600/10 blur-[140px] rounded-full pointer-events-none" />

      {/* Header */}
      <header className="max-w-7xl w-full mx-auto px-6 py-6 flex items-center justify-between relative z-10">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight">
            Project <span className="gradient-text">LOOP</span>
          </span>
        </div>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
          >
            Sign In
          </Link>
          <Link
            href="/signup"
            className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 rounded-xl shadow-lg shadow-indigo-500/25 transition-all transform hover:-translate-y-0.5"
          >
            Get Started
          </Link>
        </div>
      </header>

      {/* Main Hero */}
      <main className="max-w-5xl w-full mx-auto px-6 py-16 text-center relative z-10 flex-1 flex flex-col justify-center items-center">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-panel border border-indigo-500/30 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-8">
          <Sparkles className="w-3.5 h-3.5" /> AI Customer-Feedback Intelligence Platform
        </div>

        <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight max-w-4xl">
          Close the loop on <span className="gradient-text">scattered customer feedback</span>.
        </h1>

        <p className="mt-6 text-lg sm:text-xl text-slate-400 max-w-2xl font-light leading-relaxed">
          Ingest multi-channel support tickets, reviews, NPS surveys, and sales notes into one multi-tenant workspace. Powered by Claude AI for grounded Q&A, theme clustering, and VoC reports.
        </p>

        {/* Demo Quick Logins */}
        <div className="mt-10 p-6 glass-card rounded-2xl max-w-2xl w-full border border-indigo-500/20 text-left">
          <h3 className="text-sm font-bold text-indigo-300 uppercase tracking-wider mb-3 flex items-center justify-between">
            <span>🚀 Explore Seeded Demo Accounts</span>
            <span className="text-xs text-slate-400 font-normal">Password: password123</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Link
              href="/login?email=admin@acme.com"
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-indigo-500/50 transition-all group"
            >
              <div className="text-xs font-semibold text-indigo-400 group-hover:text-indigo-300">ADMIN ROLE</div>
              <div className="text-sm font-bold text-white mt-1">Alice Admin</div>
              <div className="text-xs text-slate-400 truncate">admin@acme.com</div>
            </Link>

            <Link
              href="/login?email=analyst@acme.com"
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-purple-500/50 transition-all group"
            >
              <div className="text-xs font-semibold text-purple-400 group-hover:text-purple-300">ANALYST ROLE</div>
              <div className="text-sm font-bold text-white mt-1">Bob Analyst</div>
              <div className="text-xs text-slate-400 truncate">analyst@acme.com</div>
            </Link>

            <Link
              href="/login?email=viewer@acme.com"
              className="p-3.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 hover:border-emerald-500/50 transition-all group"
            >
              <div className="text-xs font-semibold text-emerald-400 group-hover:text-emerald-300">VIEWER ROLE</div>
              <div className="text-sm font-bold text-white mt-1">Charlie Viewer</div>
              <div className="text-xs text-slate-400 truncate">viewer@acme.com</div>
            </Link>
          </div>
        </div>

        {/* Feature Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16 text-left w-full">
          <div className="p-6 glass-card rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-4">
              <Bot className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">AI Auto-Classification</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Every piece of feedback is automatically classified with sentiment, sentiment score, feature area label, and theme tags.
            </p>
          </div>

          <div className="p-6 glass-card rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
              <MessageSquare className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">Ask LOOP (RAG Grounded Q&A)</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              Ask plain-English questions and get instant answers strictly grounded in actual feedback items with verifiable citations.
            </p>
          </div>

          <div className="p-6 glass-card rounded-2xl">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4">
              <BarChart3 className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white mb-2">VoC Executive Reports</h3>
            <p className="text-sm text-slate-400 leading-relaxed">
              One-click Voice-of-Customer report generation synthesizing volume shifts, top themes, and recommended product action items.
            </p>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-400 relative z-10">
        Project LOOP — Zidio Web Development Track Internship Deliverable | v1.0 Corporate-Grade
      </footer>
    </div>
  );
}
