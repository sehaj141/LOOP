"use client";

import { useEffect, useState } from "react";
import {
  FileText,
  Sparkles,
  Printer,
  Calendar,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Plus,
  Quote,
  Layers,
  Award,
} from "lucide-react";

export default function ReportsPage() {
  const [reports, setReports] = useState<any[]>([]);
  const [selectedReport, setSelectedReport] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [userRole, setUserRole] = useState("VIEWER");
  const [periodDays, setPeriodDays] = useState(30);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => {
        if (data.user) setUserRole(data.user.role);
      });

    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      const data = await res.json();
      const list = data.reports || [];
      setReports(list);
      if (list.length > 0) {
        setSelectedReport(list[0]);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReport = async () => {
    if (userRole === "VIEWER") {
      alert("Forbidden: Viewers cannot generate reports.");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ days: periodDays }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Report generation failed");

      setReports((prev) => [data.report, ...prev]);
      setSelectedReport(data.report);
    } catch (err: any) {
      alert(err.message || "Failed to generate report");
    } finally {
      setGenerating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  let reportContent: any = null;
  if (selectedReport?.contentJson) {
    try {
      reportContent = JSON.parse(selectedReport.contentJson);
    } catch (e) {
      reportContent = null;
    }
  }

  const priorityColors: Record<string, string> = {
    HIGH: "bg-rose-500/10 text-rose-400 border-rose-500/30",
    MEDIUM: "bg-amber-500/10 text-amber-400 border-amber-500/30",
    LOW: "bg-emerald-500/10 text-emerald-400 border-emerald-500/30",
  };

  return (
    <div className="space-y-8">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl font-bold text-white tracking-tight flex items-center gap-2">
            Voice-of-Customer Reports
            <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2.5 py-0.5 rounded-full font-semibold">
              Executive Digest
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Pre-computed statistical synthesis & AI narrative report generation for leadership
          </p>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={periodDays}
            onChange={(e) => setPeriodDays(Number(e.target.value))}
            className="px-3 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-200 text-xs font-semibold"
          >
            <option value={7}>Past 7 Days</option>
            <option value={30}>Past 30 Days</option>
            <option value={90}>Past 90 Days</option>
          </select>

          <button
            onClick={handleGenerateReport}
            disabled={generating || userRole === "VIEWER"}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
          >
            <Sparkles className={`w-4 h-4 ${generating ? "animate-spin" : ""}`} />
            {generating ? "Synthesizing Report..." : "Generate New VoC Report"}
          </button>
        </div>
      </div>

      {/* Main Layout: Left Report Selector & Right Report Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Report Selector Sidebar (Hidden during print) */}
        <div className="lg:col-span-1 glass-card p-4 rounded-2xl border border-slate-800 space-y-3 print:hidden">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider px-2">
            Report History ({reports.length})
          </div>

          {loading ? (
            <div className="py-8 text-center text-slate-500 text-xs">Loading history...</div>
          ) : reports.length === 0 ? (
            <div className="py-8 text-center text-slate-500 text-xs">No reports generated yet.</div>
          ) : (
            <div className="space-y-1.5 max-h-[600px] overflow-y-auto pr-1">
              {reports.map((rep) => (
                <button
                  key={rep.id}
                  onClick={() => setSelectedReport(rep)}
                  className={`w-full p-3 rounded-xl text-left border transition-all ${
                    selectedReport?.id === rep.id
                      ? "bg-emerald-600/15 border-emerald-500/40 text-white shadow-md"
                      : "bg-slate-900/60 border-slate-800/80 text-slate-400 hover:text-white"
                  }`}
                >
                  <div className="text-xs font-bold truncate">{rep.title}</div>
                  <div className="text-[10px] text-slate-500 mt-1 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {new Date(rep.createdAt).toLocaleDateString()} by {rep.generatedBy?.name || "System"}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Selected Report Viewer Sheet */}
        <div className="lg:col-span-3">
          {!selectedReport || !reportContent ? (
            <div className="glass-card rounded-2xl p-16 text-center border border-slate-800">
              <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-white">Select or generate a report</h3>
              <p className="text-xs text-slate-400">
                Click "Generate New VoC Report" to synthesize period metrics into an executive PDF exportable digest.
              </p>
            </div>
          ) : (
            <div className="glass-card rounded-3xl p-8 border border-slate-800 space-y-8 print:p-0 print:border-none print:shadow-none print:bg-white print:text-black">
              {/* Report Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800/80 pb-6 print:border-gray-200">
                <div>
                  <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider print:text-emerald-700">
                    Voice of Customer Executive Report
                  </span>
                  <h2 className="text-2xl font-black text-white mt-1 print:text-black">
                    {reportContent.title || selectedReport.title}
                  </h2>
                  <div className="text-xs text-slate-400 mt-1 print:text-gray-600 flex items-center gap-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      Generated on {new Date(selectedReport.createdAt).toLocaleDateString()} for workspace: {selectedReport.workspaceId}
                    </span>
                  </div>
                </div>

                <button
                  onClick={handlePrint}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold flex items-center gap-2 border border-slate-700 self-start sm:self-auto print:hidden"
                >
                  <Printer className="w-4 h-4 text-emerald-400" />
                  Print / Export PDF
                </button>
              </div>

              {/* Section 1: Executive Summary */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-gray-800">
                  <Award className="w-4 h-4 text-emerald-400" /> 1. Executive Summary
                </h3>
                <p className="text-sm text-slate-200 leading-relaxed p-4 rounded-2xl bg-slate-900/80 border border-slate-800 print:bg-gray-50 print:text-gray-900 print:border-gray-200">
                  {reportContent.executiveSummary}
                </p>
              </div>

              {/* Section 2: Sentiment Shift Analysis */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-gray-800">
                  <Sparkles className="w-4 h-4 text-emerald-400" /> 2. Sentiment Shift Analysis
                </h3>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-center">
                    <div className="text-2xl font-black text-emerald-400">
                      {reportContent.sentimentAnalysis?.positivePercentage}%
                    </div>
                    <div className="text-[10px] font-bold uppercase text-emerald-300">Positive Sentiment</div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-500/10 border border-slate-500/20 text-center">
                    <div className="text-2xl font-black text-slate-300">
                      {reportContent.sentimentAnalysis?.neutralPercentage}%
                    </div>
                    <div className="text-[10px] font-bold uppercase text-slate-400">Neutral Sentiment</div>
                  </div>

                  <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-center">
                    <div className="text-2xl font-black text-rose-400">
                      {reportContent.sentimentAnalysis?.negativePercentage}%
                    </div>
                    <div className="text-[10px] font-bold uppercase text-rose-300">Negative Friction</div>
                  </div>
                </div>

                {reportContent.sentimentAnalysis?.shiftDescription && (
                  <p className="text-xs text-slate-400 italic">
                    Note: {reportContent.sentimentAnalysis.shiftDescription}
                  </p>
                )}
              </div>

              {/* Section 3: Top Clustered Themes */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-gray-800">
                  <Layers className="w-4 h-4 text-indigo-400" /> 3. Top Clustered Themes
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportContent.topThemes?.map((theme: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-1.5 print:bg-gray-50 print:border-gray-200">
                      <div className="flex items-center justify-between text-xs font-bold">
                        <span className="text-white print:text-black">🏷️ {theme.themeName}</span>
                        <span className="text-indigo-400 font-extrabold">{theme.count} Feedback Items</span>
                      </div>
                      <p className="text-xs text-slate-400 leading-relaxed print:text-gray-700">{theme.insight}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 4: Verbatim Quotes */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-gray-800">
                  <Quote className="w-4 h-4 text-purple-400" /> 4. Representative Verbatim Quotes
                </h3>

                <div className="space-y-2">
                  {reportContent.verbatimQuotes?.map((quote: any, idx: number) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 text-xs flex items-center justify-between gap-4 print:bg-gray-50 print:border-gray-200">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 px-2 py-0.5 rounded">
                          {quote.channel}
                        </span>
                        <p className="text-slate-200 italic font-serif print:text-gray-900">"{quote.quote}"</p>
                      </div>
                      <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded ${
                        quote.sentiment === "POS" ? "text-emerald-400" : quote.sentiment === "NEG" ? "text-rose-400" : "text-slate-400"
                      }`}>
                        {quote.sentiment}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 5: Recommended Action Items */}
              <div className="space-y-3">
                <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wider flex items-center gap-2 print:text-gray-800">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 5. Recommended Product Action Items
                </h3>

                <div className="grid grid-cols-1 gap-3">
                  {reportContent.recommendedActions?.map((act: any, idx: number) => (
                    <div key={idx} className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 flex items-start gap-3 print:bg-gray-50 print:border-gray-200">
                      <span className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${priorityColors[act.priority]}`}>
                        {act.priority} PRIORITY
                      </span>
                      <div>
                        <h4 className="text-sm font-bold text-white print:text-black">{act.title}</h4>
                        <p className="text-xs text-slate-400 mt-1 print:text-gray-700">{act.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
