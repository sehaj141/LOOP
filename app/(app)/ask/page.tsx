"use client";

import { useState } from "react";
import {
  MessageSquare,
  Sparkles,
  Send,
  Bot,
  User,
  Quote,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
} from "lucide-react";

export default function AskLoopPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<
    Array<{
      question: string;
      answer: string;
      citedItems: any[];
      timestamp: string;
    }>
  >([]);

  const sampleQuestions = [
    "What are users saying about onboarding and inviting team members?",
    "Why are customers requesting SAML SSO authentication?",
    "What feedback do we have regarding billing page timeouts and payments?",
    "How do users feel about the recent dashboard speed improvements?",
  ];

  const handleAsk = async (qText?: string) => {
    const qToSubmit = qText || question;
    if (!qToSubmit.trim()) return;

    setLoading(true);
    try {
      const res = await fetch("/api/insights/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: qToSubmit }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Q&A request failed");

      setHistory((prev) => [
        {
          question: qToSubmit,
          answer: data.answer,
          citedItems: data.citedItems || [],
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
        ...prev,
      ]);

      if (!qText) setQuestion("");
    } catch (err: any) {
      alert(err.message || "Failed to ask LOOP");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Ask LOOP (Retrieval-Grounded Q&A)
          <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
            RAG Grounded
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Ask plain-English questions. Answers are retrieved via vector semantic search and strictly grounded in real customer feedback.
        </p>
      </div>

      {/* Suggested Questions */}
      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
        <div className="text-xs font-bold text-indigo-300 uppercase tracking-wider flex items-center gap-1.5">
          <HelpCircle className="w-4 h-4" /> Try Asking Suggested Questions
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {sampleQuestions.map((sq, idx) => (
            <button
              key={idx}
              onClick={() => { setQuestion(sq); handleAsk(sq); }}
              className="p-3 rounded-xl bg-slate-900/80 hover:bg-indigo-600/10 border border-slate-800 hover:border-indigo-500/30 text-left text-xs text-slate-300 hover:text-white transition-all flex items-center justify-between group"
            >
              <span>"{sq}"</span>
              <Sparkles className="w-3.5 h-3.5 text-slate-500 group-hover:text-indigo-400 flex-shrink-0 ml-2" />
            </button>
          ))}
        </div>
      </div>

      {/* Question Input Box */}
      <div className="relative">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAsk();
          }}
          className="glass-panel p-2 rounded-2xl border border-slate-800 flex items-center gap-2 shadow-xl"
        >
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="Ask anything about customer requests, complaints, or sentiment..."
            className="w-full bg-transparent px-4 py-3 text-sm text-white placeholder-slate-500 outline-none"
          />
          <button
            type="submit"
            disabled={loading || !question.trim()}
            className="px-5 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-semibold text-xs flex items-center gap-2 shadow-lg shadow-indigo-500/20 transition-all disabled:opacity-40"
          >
            {loading ? "Searching Context..." : "Ask LOOP"}
            <Send className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

      {/* Answer History Stack */}
      <div className="space-y-6">
        {loading && (
          <div className="p-6 glass-card rounded-2xl border border-indigo-500/30 flex items-center gap-4 animate-pulse">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 flex items-center justify-center text-indigo-400">
              <Bot className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="text-sm font-bold text-white">Performing Semantic Retrieval...</div>
              <div className="text-xs text-slate-400">Scanning vector embeddings and asking Claude AI for a grounded synthesis.</div>
            </div>
          </div>
        )}

        {history.map((entry, idx) => (
          <div key={idx} className="glass-card rounded-2xl p-6 border border-slate-800 space-y-6">
            {/* Question Header */}
            <div className="flex items-start gap-3 border-b border-slate-800/80 pb-4">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-xs">
                <User className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">User Question</div>
                <h3 className="text-base font-bold text-white mt-0.5">"{entry.question}"</h3>
              </div>
              <span className="text-[11px] text-slate-500">{entry.timestamp}</span>
            </div>

            {/* Answer Content */}
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Bot className="w-4 h-4" />
              </div>
              <div className="flex-1 space-y-2">
                <div className="text-xs font-bold text-indigo-400 uppercase tracking-wider flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Grounded Synthesis
                </div>
                <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-wrap font-sans bg-slate-900/60 p-4 rounded-xl border border-slate-800">
                  {entry.answer}
                </div>
              </div>
            </div>

            {/* Cited Feedback Sources */}
            {entry.citedItems && entry.citedItems.length > 0 && (
              <div className="pt-4 border-t border-slate-800/80 space-y-3">
                <div className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Quote className="w-3.5 h-3.5 text-indigo-400" /> Grounding References ({entry.citedItems.length} Cited Customer Feedback Items)
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {entry.citedItems.map((item) => (
                    <div key={item.id} className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-indigo-300 bg-indigo-500/10 px-2 py-0.5 rounded text-[10px]">
                            {item.channel}
                          </span>
                          <span className="text-slate-400 text-[10px]">{item.sentiment}</span>
                          {item.relevanceScore && (
                            <span className="text-emerald-400 text-[10px] font-semibold">
                              Similarity: {Math.round(item.relevanceScore * 100)}%
                            </span>
                          )}
                        </div>
                        <p className="text-slate-200 italic font-serif text-xs">"{item.content}"</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
