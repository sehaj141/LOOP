"use client";

import { useEffect, useState } from "react";
import {
  TrendingUp,
  Layers,
  AlertTriangle,
  ArrowUpRight,
  MessageSquare,
  Sparkles,
  ChevronRight,
  Filter,
  X,
  CheckCircle2,
} from "lucide-react";

export default function TrendsPage() {
  const [themes, setThemes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTheme, setSelectedTheme] = useState<any | null>(null);
  const [themeFeedbacks, setThemeFeedbacks] = useState<any[]>([]);
  const [loadingDrawer, setLoadingDrawer] = useState(false);

  useEffect(() => {
    fetchThemes();
  }, []);

  const fetchThemes = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/themes");
      const data = await res.json();
      setThemes(data.themes || []);
    } catch (e) {
      console.error("Fetch themes error:", e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenThemeDrilldown = async (theme: any) => {
    setSelectedTheme(theme);
    setLoadingDrawer(true);
    try {
      const res = await fetch(`/api/feedback?themeId=${theme.id}&limit=100`);
      const data = await res.json();
      setThemeFeedbacks(data.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingDrawer(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
          Theme Clustering & Spike Trends
          <span className="text-xs bg-purple-500/10 text-purple-400 border border-purple-500/20 px-2.5 py-0.5 rounded-full font-semibold">
            AI Clustered
          </span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Automated pattern recognition grouping customer signals into actionable product themes
        </p>
      </div>

      {/* Spiking Alerts Banner */}
      {themes.some((t) => t.isSpiking) && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-amber-500/20 text-amber-400">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <div className="font-bold text-sm text-amber-200">Volume Spike Alert Detected!</div>
              <div className="text-amber-300/80">
                {themes.filter((t) => t.isSpiking).map((t) => t.name).join(", ")} recorded a volume surge (&gt;40% growth week-over-week).
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Themes Grid */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center text-slate-500 text-sm">
          <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin mb-3" />
          <span>Clustering feedback themes...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {themes.map((theme) => (
            <div
              key={theme.id}
              onClick={() => handleOpenThemeDrilldown(theme)}
              className="p-6 glass-card rounded-2xl border border-slate-800 hover:border-purple-500/40 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <span
                    className="text-xs font-bold px-3 py-1 rounded-full border"
                    style={{
                      backgroundColor: `${theme.color}15`,
                      color: theme.color,
                      borderColor: `${theme.color}30`,
                    }}
                  >
                    🏷️ {theme.name}
                  </span>

                  {theme.isSpiking && (
                    <span className="bg-rose-500/15 text-rose-400 border border-rose-500/30 text-[10px] uppercase font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                      <TrendingUp className="w-3 h-3" /> SPIKING (+{theme.growthPercent}%)
                    </span>
                  )}
                </div>

                <p className="text-xs text-slate-400 line-clamp-2 mb-4 leading-relaxed">
                  {theme.description || "Recurring topics automatically extracted from multi-channel user feedback."}
                </p>
              </div>

              <div>
                {/* Stats & Sentiment Progress Bar */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <div>
                    <div className="text-xl font-extrabold text-white">{theme.totalCount}</div>
                    <div className="text-[10px] text-slate-500 uppercase font-semibold">Total Items</div>
                  </div>

                  <div className="text-right">
                    <div className="text-xs font-semibold text-purple-400 flex items-center justify-end gap-1">
                      <span>Drill Down</span>
                      <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>

                {/* Sentiment Mini Bar */}
                <div className="mt-3 h-1.5 w-full bg-slate-900 rounded-full overflow-hidden flex">
                  <div
                    style={{
                      width: `${
                        theme.totalCount > 0
                          ? (theme.sentimentBreakdown.pos / theme.totalCount) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-emerald-500 h-full"
                    title="Positive"
                  />
                  <div
                    style={{
                      width: `${
                        theme.totalCount > 0
                          ? (theme.sentimentBreakdown.neu / theme.totalCount) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-slate-500 h-full"
                    title="Neutral"
                  />
                  <div
                    style={{
                      width: `${
                        theme.totalCount > 0
                          ? (theme.sentimentBreakdown.neg / theme.totalCount) * 100
                          : 0
                      }%`,
                    }}
                    className="bg-rose-500 h-full"
                    title="Negative"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DRILLDOWN DRAWER / MODAL */}
      {selectedTheme && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-md flex justify-end z-50">
          <div className="w-full max-w-2xl bg-[#0F1420] h-full p-6 overflow-y-auto border-l border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <span className="text-xs font-bold text-purple-400 uppercase tracking-wider">
                    Theme Drill-Down
                  </span>
                  <h2 className="text-xl font-bold text-white mt-1 flex items-center gap-2">
                    🏷️ {selectedTheme.name}
                  </h2>
                </div>
                <button
                  onClick={() => setSelectedTheme(null)}
                  className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="py-4">
                <p className="text-xs text-slate-400">{selectedTheme.description}</p>
                <div className="mt-3 flex items-center gap-4 text-xs font-semibold">
                  <span className="text-white font-bold">{themeFeedbacks.length} Feedback Items Tagged</span>
                </div>
              </div>

              {/* Feedbacks list */}
              {loadingDrawer ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  Loading theme feedback records...
                </div>
              ) : themeFeedbacks.length === 0 ? (
                <div className="py-12 text-center text-slate-500 text-xs">
                  No items tagged under this theme yet.
                </div>
              ) : (
                <div className="space-y-3">
                  {themeFeedbacks.map((fb) => (
                    <div key={fb.id} className="p-4 rounded-xl glass-card border border-slate-800 space-y-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-slate-300 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                          {fb.channel}
                        </span>
                        <span className={`font-bold px-2 py-0.5 rounded ${
                          fb.sentiment === "POS" ? "text-emerald-400" : fb.sentiment === "NEG" ? "text-rose-400" : "text-slate-400"
                        }`}>
                          {fb.sentiment}
                        </span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">"{fb.content}"</p>
                      <div className="text-[10px] text-slate-500">
                        Submitted {new Date(fb.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <button
                onClick={() => setSelectedTheme(null)}
                className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold"
              >
                Close Drilldown
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
