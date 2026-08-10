"use client";

import { useEffect, useState } from "react";
import {
  MessageSquare,
  TrendingDown,
  TrendingUp,
  Clock,
  Sparkles,
  Calendar,
  Layers,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
} from "recharts";

export default function DashboardPage() {
  const [dateRange, setDateRange] = useState("30d");
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    negativeCount: 0,
    negativePercent: 0,
    newThisWeek: 0,
    actionedRate: 0,
  });

  const [volumeTrend, setVolumeTrend] = useState<any[]>([]);
  const [sentimentData, setSentimentData] = useState<any[]>([]);
  const [topThemes, setTopThemes] = useState<any[]>([]);

  useEffect(() => {
    fetchDashboardData(dateRange);
  }, [dateRange]);

  const fetchDashboardData = async (range: string) => {
    setLoading(true);
    try {
      // 1. Fetch Feedback items
      const fbRes = await fetch(`/api/feedback?limit=500&dateRange=${range}`);
      const fbData = await fbRes.json();
      const items: any[] = fbData.items || [];

      // 2. Compute Stat Cards
      const total = items.length;
      const negCount = items.filter((i) => i.sentiment === "NEG").length;
      const posCount = items.filter((i) => i.sentiment === "POS").length;
      const neuCount = items.filter((i) => i.sentiment === "NEU").length;

      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const newThisWeek = items.filter((i) => new Date(i.createdAt) >= sevenDaysAgo).length;
      const actionedCount = items.filter((i) => i.status === "ACTIONED").length;

      setStats({
        total,
        negativeCount: negCount,
        negativePercent: total > 0 ? Math.round((negCount / total) * 100) : 0,
        newThisWeek,
        actionedRate: total > 0 ? Math.round((actionedCount / total) * 100) : 0,
      });

      // 3. Compute Volume Trend over time (grouped by date)
      const trendMap: Record<string, { date: string; volume: number; pos: number; neg: number }> = {};
      items.forEach((item) => {
        const dStr = new Date(item.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
        if (!trendMap[dStr]) {
          trendMap[dStr] = { date: dStr, volume: 0, pos: 0, neg: 0 };
        }
        trendMap[dStr].volume += 1;
        if (item.sentiment === "POS") trendMap[dStr].pos += 1;
        if (item.sentiment === "NEG") trendMap[dStr].neg += 1;
      });

      const trendArr = Object.values(trendMap).slice(-14);
      setVolumeTrend(trendArr);

      // 4. Sentiment Pie Data
      setSentimentData([
        { name: "Positive", value: posCount, color: "#10b981" },
        { name: "Neutral", value: neuCount, color: "#64748b" },
        { name: "Negative", value: negCount, color: "#ef4444" },
      ]);

      // 5. Fetch Themes
      const themesRes = await fetch("/api/themes");
      const themesData = await themesRes.json();
      const themesList = themesData.themes || [];

      setTopThemes(
        themesList.slice(0, 5).map((t: any) => ({
          name: t.name,
          count: t.totalCount,
          isSpiking: t.isSpiking,
        }))
      );
    } catch (err) {
      console.error("Dashboard fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      {/* Header & Date Range Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Analytics Overview
            <span className="text-xs bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              Live Data
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time customer feedback volume, sentiment breakdown, and emerging themes
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900/90 p-1.5 rounded-xl border border-slate-800 self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-slate-400 ml-2" />
          {["7d", "30d", "90d", "all"].map((r) => (
            <button
              key={r}
              onClick={() => setDateRange(r)}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg uppercase transition-all ${
                dateRange === r
                  ? "bg-indigo-600 text-white shadow-md shadow-indigo-500/20"
                  : "text-slate-400 hover:text-white"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="p-5 glass-card rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Total Feedback Items</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <MessageSquare className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{loading ? "..." : stats.total}</div>
          <div className="text-xs text-slate-400 mt-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Across all ingestion channels</span>
          </div>
        </div>

        <div className="p-5 glass-card rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Negative Sentiment Rate</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {loading ? "..." : `${stats.negativePercent}%`}
          </div>
          <div className="text-xs text-rose-400 mt-2 flex items-center gap-1">
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>{stats.negativeCount} items requiring friction resolution</span>
          </div>
        </div>

        <div className="p-5 glass-card rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">New This Week</span>
            <div className="p-2 rounded-xl bg-purple-500/10 text-purple-400">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">{loading ? "..." : stats.newThisWeek}</div>
          <div className="text-xs text-purple-400 mt-2 flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" />
            <span>Recent customer signals</span>
          </div>
        </div>

        <div className="p-5 glass-card rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-slate-400 mb-3">
            <span className="text-xs font-semibold uppercase tracking-wider">Actioned Triage Rate</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-black text-white">
            {loading ? "..." : `${stats.actionedRate}%`}
          </div>
          <div className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Marked ACTIONED in inbox</span>
          </div>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chart 1: Volume Over Time (2 cols) */}
        <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-base font-bold text-white">Feedback Volume Over Time</h3>
              <p className="text-xs text-slate-400">Daily incoming feedback submissions</p>
            </div>
            <span className="text-xs text-indigo-400 bg-indigo-500/10 px-2.5 py-1 rounded-full border border-indigo-500/20 font-semibold">
              Volume Trend
            </span>
          </div>

          <div className="h-72 w-full">
            {loading ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                Loading volume chart...
              </div>
            ) : volumeTrend.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-500 text-sm">
                No feedback data available for this range.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={volumeTrend}>
                  <defs>
                    <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366f1" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" vertical={false} />
                  <XAxis dataKey="date" stroke="#64748b" fontSize={12} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#131927", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                  />
                  <Area type="monotone" dataKey="volume" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Chart 2: Sentiment Breakdown Pie */}
        <div className="glass-card p-6 rounded-2xl border border-slate-800 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold text-white mb-1">Sentiment Distribution</h3>
            <p className="text-xs text-slate-400 mb-4">Breakdown by POS, NEU, and NEG</p>
          </div>

          <div className="h-56 w-full relative flex items-center justify-center">
            {loading ? (
              <span className="text-slate-500 text-sm">Loading sentiment...</span>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={sentimentData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {sentimentData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: "#131927", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Custom Pie Legend */}
          <div className="grid grid-cols-3 gap-2 text-center pt-2 border-t border-slate-800">
            {sentimentData.map((item) => (
              <div key={item.name} className="p-2 rounded-xl bg-slate-900/60 border border-slate-800">
                <div className="text-[10px] uppercase font-bold text-slate-400">{item.name}</div>
                <div className="text-sm font-extrabold text-white">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Chart 3: Top Themes Bar Chart */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-white">Top Feedback Themes</h3>
            <p className="text-xs text-slate-400">Most frequent topics automatically clustered by AI</p>
          </div>
        </div>

        <div className="h-64 w-full">
          {loading ? (
            <div className="h-full flex items-center justify-center text-slate-500 text-sm">
              Loading themes...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topThemes} layout="vertical" margin={{ left: 40, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1E293B" horizontal={false} />
                <XAxis type="number" stroke="#64748b" fontSize={12} />
                <YAxis dataKey="name" type="category" stroke="#64748b" fontSize={11} width={180} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#131927", borderColor: "#334155", borderRadius: "12px", color: "#fff" }}
                />
                <Bar dataKey="count" fill="#818cf8" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
